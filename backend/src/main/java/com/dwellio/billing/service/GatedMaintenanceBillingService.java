package com.dwellio.billing.service;

import com.dwellio.billing.cycle.BillingCycleCalculator;
import com.dwellio.billing.repository.BillingRuleRepository;
import com.dwellio.billing.resolver.BillToResolution;
import com.dwellio.billing.resolver.BillToResolver;
import com.dwellio.domain.entity.BillingRule;
import com.dwellio.domain.entity.Occupancy;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Payment;
import com.dwellio.domain.entity.Space;
import com.dwellio.domain.enums.BillingAppliesTo;
import com.dwellio.domain.enums.BillingRecurrence;
import com.dwellio.domain.enums.ChargeType;
import com.dwellio.domain.enums.NotificationType;
import com.dwellio.domain.enums.OrganizationType;
import com.dwellio.domain.enums.PaymentStatus;
import com.dwellio.domain.enums.SpaceType;
import com.dwellio.ledger.service.LedgerService;
import com.dwellio.notification.repository.NotificationRepository;
import com.dwellio.notification.service.NotificationService;
import com.dwellio.payment.event.PaymentEventPublisher;
import com.dwellio.payment.repository.PaymentRepository;
import com.dwellio.occupancy.repository.OccupancyRepository;
import com.dwellio.activity.ActivityEventTypes;
import com.dwellio.activity.service.ActivityEventRecorder;
import com.dwellio.domain.enums.ActivityEventCategory;
import com.dwellio.space.repository.SpaceRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class GatedMaintenanceBillingService {

    private static final String SOURCE_PAYMENT = "PAYMENT";

    private final BillingRuleRepository billingRuleRepository;
    private final SpaceRepository spaceRepository;
    private final OccupancyRepository occupancyRepository;
    private final PaymentRepository paymentRepository;
    private final BillToResolver billToResolver;
    private final BillingCycleCalculator billingCycleCalculator;
    private final LedgerService ledgerService;
    private final ActivityEventRecorder activityEventRecorder;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final PaymentEventPublisher paymentEventPublisher;
    private final Clock clock;

    @Transactional
    public void syncOrganization(Organization organization) {
        if (organization.getType() != OrganizationType.GATED_COMMUNITY) {
            return;
        }

        LocalDate today = LocalDate.now(clock);
        List<BillingRule> rules = billingRuleRepository.findAllActiveByOrganizationId(organization.getId()).stream()
                .filter(rule -> rule.getRecurrence() == BillingRecurrence.MONTHLY)
                .toList();
        if (rules.isEmpty()) {
            return;
        }

        List<Space> units = spaceRepository.findAllActiveByOrganizationId(organization.getId()).stream()
                .filter(space -> space.getSpaceType() == SpaceType.UNIT)
                .toList();

        boolean metricsChanged = false;
        for (BillingRule rule : rules) {
            Set<UUID> targetUnitIds = resolveTargetUnits(organization, rule, units);
            YearMonth month = YearMonth.from(today);
            LocalDate billingMonth = billingCycleCalculator.billingMonthAnchor(month);

            for (UUID unitId : targetUnitIds) {
                Space unit = units.stream()
                        .filter(candidate -> candidate.getId().equals(unitId))
                        .findFirst()
                        .orElse(null);
                if (unit == null) {
                    continue;
                }

                if (paymentRepository
                        .findByOrganizationIdAndUnitSpaceIdAndBillingMonthAndChargeTypeAndDeletedAtIsNull(
                                organization.getId(),
                                unitId,
                                billingMonth,
                                rule.getChargeType()
                        )
                        .isPresent()) {
                    continue;
                }

                var resolution = billToResolver.resolveForUnit(organization, unit, rule, today);
                if (resolution.isEmpty()) {
                    continue;
                }

                BillToResolution billTo = resolution.get();
                Occupancy occupancy = occupancyRepository
                        .findCurrentOccupancyByUnitSpaceId(organization.getId(), unitId)
                        .orElse(null);
                LocalDate dueDate = billingCycleCalculator.dueDate(organization, rule, month, occupancy);
                BigDecimal amount = rule.getDefaultAmount() != null
                        ? rule.getDefaultAmount()
                        : BigDecimal.ZERO;

                Payment payment = new Payment();
                payment.setId(UUID.randomUUID());
                payment.setOrganization(organization);
                payment.setMembership(billTo.membership());
                payment.setUnitSpace(unit);
                payment.setBillingMonth(billingMonth);
                payment.setAmount(amount);
                payment.setAmountPaid(BigDecimal.ZERO);
                payment.setDueDate(dueDate);
                payment.setChargeType(rule.getChargeType());
                payment.setDescription(buildDescription(unit, rule, billTo));
                payment.setStatus(dueDate.isBefore(today) ? PaymentStatus.OVERDUE : PaymentStatus.PENDING);
                Payment saved = paymentRepository.save(payment);
                ledgerService.recordChargeGenerated(saved, null);
                recordChargeGenerated(saved);
                notifyPaymentCreated(organization, saved);
                notifyOwnerProxy(organization, saved, billTo);
                metricsChanged = true;
            }
        }

        if (metricsChanged) {
            paymentEventPublisher.publishMetricsChanged(organization.getId());
        }
    }

    private Set<UUID> resolveTargetUnits(Organization organization, BillingRule rule, List<Space> units) {
        Set<UUID> targetUnitIds = new HashSet<>();
        if (rule.getAppliesTo() == BillingAppliesTo.ALL_ACTIVE_UNITS) {
            units.forEach(unit -> targetUnitIds.add(unit.getId()));
            return targetUnitIds;
        }

        for (Space unit : units) {
            if (occupancyRepository.existsCurrentByUnitSpaceId(unit.getId())) {
                targetUnitIds.add(unit.getId());
            }
        }
        return targetUnitIds;
    }

    private static String buildDescription(Space unit, BillingRule rule, BillToResolution billTo) {
        String unitLabel = unit.getDisplayName() != null ? unit.getDisplayName() : unit.getIdentifier();
        String base = rule.getChargeType().name() + " — " + unitLabel;
        if (billTo.billedOnBehalfOfOwner() && billTo.ownerNotifyEmail() != null) {
            return base + " (owner: " + billTo.ownerNotifyEmail() + ")";
        }
        return base;
    }

    private void notifyOwnerProxy(Organization organization, Payment payment, BillToResolution billTo) {
        if (!billTo.billedOnBehalfOfOwner() || billTo.ownerNotifyEmail() == null) {
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("paymentId", payment.getId().toString());
        payload.put("organizationSlug", organization.getSlug());
        payload.put("ownerEmail", billTo.ownerNotifyEmail());

        notificationService.create(
                payment.getMembership().getUser().getId(),
                organization.getId(),
                NotificationType.PAYMENT_DUE,
                "Maintenance billed on behalf of owner",
                payment.getDescription() + " — owner contact " + billTo.ownerNotifyEmail(),
                payload
        );
    }

    private void recordChargeGenerated(Payment payment) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("paymentId", payment.getId().toString());
        metadata.put("amount", payment.getAmount());
        metadata.put("amountPaid", payment.getAmountPaid());
        metadata.put("status", payment.getStatus().name());
        activityEventRecorder.record(
                payment.getOrganization().getId(),
                payment.getMembership().getId(),
                ActivityEventCategory.BILLING,
                ActivityEventTypes.CHARGE_GENERATED,
                "Charge generated",
                chargeDescription(payment),
                metadata,
                payment.getCreatedAt(),
                SOURCE_PAYMENT,
                paymentSourceId(payment.getId(), "CHARGE")
        );
    }

    private void notifyPaymentCreated(Organization organization, Payment payment) {
        if (notificationRepository.existsRecentForPayment(
                payment.getMembership().getUser().getId(),
                organization.getId(),
                NotificationType.PAYMENT_DUE.name(),
                payment.getId().toString(),
                Instant.now(clock).minus(1, ChronoUnit.HOURS)
        )) {
            return;
        }
        notifyPaymentDue(organization, payment);
    }

    private void notifyPaymentDue(Organization organization, Payment payment) {
        UUID userId = payment.getMembership().getUser().getId();
        Map<String, Object> payload = new HashMap<>();
        payload.put("paymentId", payment.getId().toString());
        payload.put("organizationSlug", organization.getSlug());
        payload.put("targetPath", "/app/" + organization.getSlug() + "/resident/payments");
        payload.put("billingMonth", payment.getBillingMonth().toString());

        notificationService.create(
                userId,
                organization.getId(),
                NotificationType.PAYMENT_DUE,
                "Payment due",
                (payment.getDescription() != null ? payment.getDescription() : payment.getChargeType().name())
                        + " — ₹" + payment.getAmount() + " due.",
                payload
        );
    }

    private static String chargeDescription(Payment payment) {
        if (payment.getDescription() != null && !payment.getDescription().isBlank()) {
            return payment.getDescription();
        }
        return payment.getChargeType().name() + " — ₹" + payment.getAmount();
    }

    private static UUID paymentSourceId(UUID paymentId, String suffix) {
        return UUID.nameUUIDFromBytes((paymentId.toString() + ":" + suffix).getBytes());
    }
}
