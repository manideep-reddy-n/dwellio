package com.dwellio.payment.service;

import com.dwellio.accommodation.service.AccommodationGuard;
import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.common.security.MembershipContext;
import com.dwellio.domain.entity.Invoice;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Occupancy;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Payment;
import com.dwellio.domain.entity.User;
import com.dwellio.domain.enums.ChargeType;
import com.dwellio.domain.enums.InvoiceStatus;
import com.dwellio.domain.enums.NotificationType;
import com.dwellio.domain.enums.OrganizationType;
import com.dwellio.domain.enums.PaymentStatus;
import com.dwellio.invoice.repository.InvoiceRepository;
import com.dwellio.invoice.service.InvoiceService;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.notification.repository.NotificationRepository;
import com.dwellio.notification.service.NotificationService;
import com.dwellio.occupancy.repository.OccupancyRepository;
import com.dwellio.organization.repository.OrganizationRepository;
import com.dwellio.payment.dto.CreateManualChargeRequest;
import com.dwellio.payment.dto.PaymentResponse;
import com.dwellio.payment.dto.RecordPaymentRequest;
import com.dwellio.activity.ActivityEventTypes;
import com.dwellio.activity.service.ActivityEventRecorder;
import com.dwellio.domain.enums.ActivityEventCategory;
import com.dwellio.ledger.service.LedgerService;
import com.dwellio.payment.event.PaymentEventPublisher;
import com.dwellio.payment.repository.PaymentRepository;
import com.dwellio.payment.repository.PaymentTransactionRepository;
import com.dwellio.payment.service.CashfreeService;
import com.dwellio.payment.dto.CheckoutRequest;
import com.dwellio.payment.dto.CheckoutResponse;
import com.dwellio.domain.entity.PaymentTransaction;
import com.dwellio.domain.enums.TransactionStatus;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private static final String SOURCE_PAYMENT = "PAYMENT";

    private final PaymentRepository paymentRepository;
    private final LedgerService ledgerService;
    private final ActivityEventRecorder activityEventRecorder;
    private final PaymentEventPublisher paymentEventPublisher;
    private final InvoiceRepository invoiceRepository;
    private final NotificationRepository notificationRepository;
    private final MembershipRepository membershipRepository;
    private final OccupancyRepository occupancyRepository;
    private final OrganizationRepository organizationRepository;
    private final NotificationService notificationService;
    private final AccommodationGuard accommodationGuard;
    private final AuthorizationService authorizationService;
    private final Clock clock;
    private final CashfreeService cashfreeService;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final InvoiceService invoiceService;

    @Transactional
    public List<PaymentResponse> listForOrganization(UUID organizationId) {
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        try {
            syncMonthlyPayments(organization);
        } catch (Exception ex) {
            log.warn("Rent payment sync failed for org {}: {}", organizationId, ex.getMessage());
        }
        return paymentRepository.findAllActiveByOrganizationId(organizationId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<PaymentResponse> listMine(UUID organizationId) {
        MembershipContext context = authorizationService.requirePermission(organizationId, "payment:read_own");
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        try {
            syncMonthlyPayments(organization);
        } catch (Exception ex) {
            log.warn("Rent payment sync failed for org {}: {}", organizationId, ex.getMessage());
        }
        List<Payment> payments = paymentRepository.findAllActiveByOrganizationIdAndMembershipId(
                organizationId,
                context.getMembershipId()
        );
        payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.OVERDUE)
                .forEach(p -> notifyPaymentDue(organization, p));
        return payments.stream().map(this::toResponse).toList();
    }

    @Transactional
    public List<PaymentResponse> createManualCharges(UUID organizationId, CreateManualChargeRequest request) {
        authorizationService.requirePermission(organizationId, "payment:manage");
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        LocalDate today = LocalDate.now(clock);

        List<Payment> created = request.membershipIds().stream()
                .map(membershipId -> createManualCharge(organization, request, membershipId, today))
                .toList();

        created.forEach(payment -> {
            ledgerService.recordChargeGenerated(payment, null);
            recordChargeGenerated(payment);
            notifyPaymentCreated(organization, payment);
        });
        paymentEventPublisher.publishMetricsChanged(organizationId);

        return created.stream().map(this::toResponse).toList();
    }

    @Transactional
    public PaymentResponse recordPayment(
            UUID organizationId,
            UUID paymentId,
            RecordPaymentRequest request,
            UserPrincipal principal
    ) {
        authorizationService.requirePermission(organizationId, "payment:manage");
        Payment payment = paymentRepository.findByIdAndOrganizationIdAndDeletedAtIsNull(paymentId, organizationId)
                .orElseThrow(() -> new NotFoundException("Payment not found"));

        BigDecimal dueAmount = payment.getAmount().setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal previousPaid = payment.getAmountPaid();
        BigDecimal amountPaid = (request.amountPaid() != null ? request.amountPaid() : BigDecimal.ZERO)
                .setScale(2, java.math.RoundingMode.HALF_UP);
        if (amountPaid.compareTo(dueAmount) > 0) {
            throw new BadRequestException("Paid amount cannot exceed due amount");
        }

        payment.setAmountPaid(amountPaid);
        payment.setStatus(resolveStatus(dueAmount, amountPaid, request.status()));
        payment.setNotes(request.notes());
        payment.setPaidAt(payment.getStatus() == PaymentStatus.PAID ? Instant.now(clock) : null);
        payment.setRecordedBy(referenceUser(principal.getId()));

        Payment saved = paymentRepository.save(payment);
        if (saved.getStatus() == PaymentStatus.PAID) {
            try {
                invoiceService.autoGenerateAndShare(saved.getOrganization(), saved, referenceUser(principal.getId()));
            } catch (Exception ex) {
                log.error("Failed to auto-generate invoice for payment {}", saved.getId(), ex);
            }
        }
        ledgerService.recordPaymentReceived(saved, previousPaid, referenceUser(principal.getId()));
        recordPaymentReceived(saved);
        notifyPaymentRecorded(organizationId, saved);
        paymentEventPublisher.publishMetricsChanged(organizationId);
        return toResponse(saved);
    }

    @Transactional
    public void syncAllOrganizations() {
        organizationRepository.findAllActive().forEach(this::syncMonthlyPayments);
    }

    @Transactional
    public CheckoutResponse initiateCheckout(UUID organizationId, UUID paymentId, CheckoutRequest request, UserPrincipal principal) {
        authorizationService.requirePermission(organizationId, "payment:read_own");
        Payment payment = paymentRepository.findByIdAndOrganizationIdAndDeletedAtIsNull(paymentId, organizationId)
                .orElseThrow(() -> new NotFoundException("Payment not found"));

        BigDecimal pendingAmount = payment.getAmount().subtract(payment.getAmountPaid());
        if (request.amount().compareTo(pendingAmount) > 0) {
            throw new BadRequestException("Cannot pay more than pending amount");
        }

        String orderId = "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        User user = payment.getMembership().getUser();
        
        CashfreeService.CashfreeOrderResponse cfResponse = cashfreeService.createOrder(
            orderId,
            request.amount(),
            user.getId().toString(),
            user.getFullName(),
            user.getPhone(),
            user.getEmail()
        );

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setId(UUID.randomUUID());
        transaction.setPayment(payment);
        transaction.setGatewayOrderId(cfResponse.orderId());
        transaction.setGatewaySessionId(cfResponse.paymentSessionId());
        transaction.setAmount(request.amount());
        transaction.setStatus(TransactionStatus.PENDING);
        paymentTransactionRepository.save(transaction);

        return new CheckoutResponse(cfResponse.paymentSessionId(), cfResponse.orderId());
    }

    @Transactional
    public PaymentResponse verifyPayment(UUID organizationId, UUID paymentId, String orderId) {
        PaymentTransaction transaction = paymentTransactionRepository.findByGatewayOrderId(orderId)
                .orElseThrow(() -> new NotFoundException("Transaction not found"));

        if (!transaction.getPayment().getId().equals(paymentId) || !transaction.getPayment().getOrganization().getId().equals(organizationId)) {
            throw new BadRequestException("Payment mismatch");
        }

        if (transaction.getStatus() == TransactionStatus.SUCCESS) {
            return toResponse(transaction.getPayment());
        }

        String status = cashfreeService.getOrderStatus(orderId);
        if ("PAID".equalsIgnoreCase(status)) {
            transaction.setStatus(TransactionStatus.SUCCESS);
            
            Payment payment = transaction.getPayment();
            BigDecimal previousPaid = payment.getAmountPaid();
            BigDecimal newAmountPaid = previousPaid.add(transaction.getAmount());
            payment.setAmountPaid(newAmountPaid);
            payment.setStatus(resolveStatus(payment.getAmount(), newAmountPaid, payment.getStatus()));
            if (payment.getStatus() == PaymentStatus.PAID) {
                payment.setPaidAt(Instant.now(clock));
            }
            payment = paymentRepository.save(payment);
            if (payment.getStatus() == PaymentStatus.PAID) {
                try {
                    invoiceService.autoGenerateAndShare(payment.getOrganization(), payment, payment.getMembership().getUser());
                } catch (Exception ex) {
                    log.error("Failed to auto-generate invoice for payment {}", payment.getId(), ex);
                }
            }
            
            ledgerService.recordPaymentReceived(payment, previousPaid, payment.getMembership().getUser());
            recordPaymentReceived(payment);
            notifyPaymentRecorded(organizationId, payment);
            paymentEventPublisher.publishMetricsChanged(organizationId);
        } else if ("ACTIVE".equalsIgnoreCase(status)) {
            // Still pending
        } else {
            transaction.setStatus(TransactionStatus.FAILED);
        }
        
        paymentTransactionRepository.save(transaction);
        return toResponse(transaction.getPayment());
    }

    private Payment createManualCharge(
            Organization organization,
            CreateManualChargeRequest request,
            UUID membershipId,
            LocalDate today
    ) {
        Membership membership = membershipRepository.findActiveByIdAndOrganizationId(membershipId, organization.getId())
                .orElseThrow(() -> new NotFoundException("Membership not found: " + membershipId));

        Payment payment = new Payment();
        payment.setId(UUID.randomUUID());
        payment.setOrganization(organization);
        payment.setMembership(membership);
        payment.setBillingMonth(request.dueDate().withDayOfMonth(1));
        payment.setAmount(request.amount());
        payment.setAmountPaid(BigDecimal.ZERO);
        payment.setDueDate(request.dueDate());
        payment.setChargeType(request.chargeType());
        payment.setDescription(request.description());
        payment.setStatus(request.dueDate().isBefore(today) ? PaymentStatus.OVERDUE : PaymentStatus.PENDING);
        Payment saved = paymentRepository.save(payment);
        ledgerService.recordChargeGenerated(saved, null);
        return saved;
    }

    private void syncMonthlyPayments(Organization organization) {
        if (organization.getType() == OrganizationType.GATED_COMMUNITY) {
            return;
        }

        LocalDate today = LocalDate.now(clock);

        for (Occupancy occupancy : occupancyRepository.findAllByOrganizationId(organization.getId()).stream()
                .filter(Occupancy::isCurrent)
                .toList()) {
            Membership membership = occupancy.getMembership();
            BigDecimal monthlyRent = occupancy.getMonthlyRent() != null
                    ? occupancy.getMonthlyRent()
                    : (organization.getDefaultMonthlyRent() != null
                            ? organization.getDefaultMonthlyRent()
                            : BigDecimal.valueOf(8000));
            LocalDate moveIn = occupancy.getMoveInDate();
            if (moveIn == null) {
                continue;
            }

            YearMonth start = YearMonth.from(moveIn);
            YearMonth end = YearMonth.from(today);
            for (YearMonth month = start; !month.isAfter(end); month = month.plusMonths(1)) {
                LocalDate billingMonth = month.atDay(1);
                if (paymentRepository
                        .findByMembershipIdAndBillingMonthAndChargeTypeAndDeletedAtIsNull(
                                membership.getId(), billingMonth, ChargeType.RENT)
                        .isPresent()) {
                    continue;
                }

                int dueDay = Math.min(moveIn.getDayOfMonth(), month.lengthOfMonth());
                LocalDate dueDate = month.atDay(dueDay);
                if (dueDate.isBefore(moveIn)) {
                    dueDate = moveIn;
                }

                Payment payment = new Payment();
                payment.setId(UUID.randomUUID());
                payment.setOrganization(organization);
                payment.setMembership(membership);
                payment.setBillingMonth(billingMonth);
                payment.setAmount(monthlyRent);
                payment.setAmountPaid(BigDecimal.ZERO);
                payment.setDueDate(dueDate);
                payment.setChargeType(ChargeType.RENT);
                payment.setDescription("Monthly rent");
                payment.setStatus(dueDate.isBefore(today) ? PaymentStatus.OVERDUE : PaymentStatus.PENDING);
                Payment saved = paymentRepository.save(payment);
                ledgerService.recordChargeGenerated(saved, null);
                recordChargeGenerated(saved);
                notifyPaymentCreated(organization, saved);
            }

            refreshStatuses(organization, membership, today);
        }
    }

    private void refreshStatuses(Organization organization, Membership membership, LocalDate today) {
        for (Payment payment : paymentRepository.findAllActiveByOrganizationIdAndMembershipId(
                organization.getId(),
                membership.getId()
        )) {
            if (payment.getChargeType() != ChargeType.RENT) {
                continue;
            }
            PaymentStatus next = resolveStatus(payment.getAmount(), payment.getAmountPaid(), payment.getStatus());
            if (payment.getDueDate().isBefore(today) && next != PaymentStatus.PAID) {
                next = payment.getAmountPaid().signum() > 0 ? PaymentStatus.PARTIAL : PaymentStatus.OVERDUE;
            }
            if (payment.getStatus() != next) {
                PaymentStatus previous = payment.getStatus();
                payment.setStatus(next);
                paymentRepository.save(payment);
                if (next == PaymentStatus.OVERDUE && previous != PaymentStatus.OVERDUE) {
                    recordOverdue(payment);
                    notifyPaymentDue(organization, payment);
                }
            }
        }
    }

    public PaymentResponse toResponse(Payment payment) {
        Invoice invoice = invoiceRepository.findActiveByPaymentId(payment.getId()).orElse(null);
        return new PaymentResponse(
                payment.getId(),
                payment.getMembership().getId(),
                payment.getMembership().getUser().getFullName(),
                payment.getMembership().getUser().getEmail(),
                payment.getMembership().getUser().getPhone(),
                payment.getBillingMonth(),
                payment.getAmount(),
                payment.getAmountPaid(),
                payment.getDueDate(),
                payment.getStatus(),
                payment.getChargeType(),
                payment.getDescription(),
                payment.getNotes(),
                payment.getPaidAt(),
                invoice != null ? invoice.getId() : null,
                invoice != null ? invoice.getInvoiceNumber() : null,
                invoice != null ? invoice.getStatus() : null,
                invoice != null && invoice.getStatus() == InvoiceStatus.SHARED
        );
    }

    private PaymentStatus resolveStatus(BigDecimal due, BigDecimal paid, PaymentStatus requested) {
        if (paid.compareTo(due) >= 0) {
            return PaymentStatus.PAID;
        }
        if (paid.signum() > 0) {
            return PaymentStatus.PARTIAL;
        }
        if (requested == PaymentStatus.OVERDUE) {
            return PaymentStatus.OVERDUE;
        }
        return PaymentStatus.PENDING;
    }

    private void notifyPaymentCreated(Organization organization, Payment payment) {
        if (notificationRepository.existsRecentForPayment(
                payment.getMembership().getUser().getId(),
                organization.getId(),
                NotificationType.PAYMENT_DUE,
                payment.getId().toString(),
                Instant.now(clock).minus(1, ChronoUnit.HOURS)
        )) {
            return;
        }
        notifyPaymentDue(organization, payment);
    }

    private void notifyPaymentRecorded(UUID organizationId, Payment payment) {
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        String slug = organization.getSlug();
        Map<String, Object> payload = new HashMap<>();
        payload.put("paymentId", payment.getId().toString());
        payload.put("organizationSlug", slug);
        payload.put("targetPath", "/app/" + slug + "/resident/payments");

        String statusLabel = payment.getStatus() == PaymentStatus.PAID
                ? "marked as paid"
                : payment.getStatus() == PaymentStatus.PARTIAL
                        ? "partially recorded"
                        : "updated";

        String desc = payment.getDescription() != null ? payment.getDescription() : payment.getChargeType().name();
        String residentName = payment.getMembership().getUser().getFullName();

        notificationService.create(
                payment.getMembership().getUser().getId(),
                organizationId,
                NotificationType.PAYMENT_RECORDED,
                "Payment " + statusLabel,
                desc + " — ₹" + payment.getAmountPaid() + " of ₹" + payment.getAmount() + " recorded.",
                payload
        );

        for (Membership owner : membershipRepository.findActiveOwnersByOrganizationId(organizationId)) {
            if (owner.getUser().getId().equals(payment.getMembership().getUser().getId())) {
                continue;
            }
            Map<String, Object> ownerPayload = new HashMap<>();
            ownerPayload.put("paymentId", payment.getId().toString());
            ownerPayload.put("organizationSlug", slug);
            ownerPayload.put("targetPath", "/app/" + slug + "/operations/payments");

            notificationService.create(
                    owner.getUser().getId(),
                    organizationId,
                    NotificationType.PAYMENT_RECORDED,
                    "Payment Received: " + residentName,
                    residentName + " paid ₹" + payment.getAmountPaid() + " for " + desc + ".",
                    ownerPayload
            );
        }
    }

    private void notifyPaymentDue(Organization organization, Payment payment) {
        UUID userId = payment.getMembership().getUser().getId();
        Instant since = Instant.now(clock).minus(1, ChronoUnit.DAYS);
        if (notificationRepository.existsRecentForPayment(
                userId,
                organization.getId(),
                NotificationType.PAYMENT_DUE,
                payment.getId().toString(),
                since
        )) {
            return;
        }

        String label = payment.getChargeType() == ChargeType.RENT ? "Rent payment due" : "Payment due";
        Map<String, Object> payload = new HashMap<>();
        payload.put("paymentId", payment.getId().toString());
        payload.put("organizationSlug", organization.getSlug());
        payload.put("targetPath", "/app/" + organization.getSlug() + "/resident/payments");
        payload.put("billingMonth", payment.getBillingMonth().toString());

        notificationService.create(
                userId,
                organization.getId(),
                NotificationType.PAYMENT_DUE,
                label,
                (payment.getDescription() != null ? payment.getDescription() : payment.getChargeType().name())
                        + " — ₹" + payment.getAmount() + " due. Contact your property team after paying.",
                payload
        );
    }

    private User referenceUser(UUID userId) {
        User user = new User();
        user.setId(userId);
        return user;
    }

    private void recordChargeGenerated(Payment payment) {
        recordBillingEvent(
                payment,
                ActivityEventTypes.CHARGE_GENERATED,
                "Charge generated",
                paymentSourceId(payment.getId(), "CHARGE"),
                payment.getCreatedAt()
        );
    }

    private void recordPaymentReceived(Payment payment) {
        if (payment.getAmountPaid() == null || payment.getAmountPaid().signum() <= 0) {
            return;
        }
        Instant paidAt = payment.getPaidAt() != null ? payment.getPaidAt() : payment.getUpdatedAt();
        recordBillingEvent(
                payment,
                ActivityEventTypes.PAYMENT_RECEIVED,
                "Payment received",
                paymentSourceId(payment.getId(), "PAYMENT"),
                paidAt
        );
    }

    private void recordOverdue(Payment payment) {
        recordBillingEvent(
                payment,
                ActivityEventTypes.LATE_FEE_APPLIED,
                "Payment overdue",
                paymentSourceId(payment.getId(), "OVERDUE"),
                payment.getDueDate().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()
        );
    }

    private void recordBillingEvent(
            Payment payment,
            String eventType,
            String title,
            UUID sourceId,
            Instant occurredAt
    ) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("paymentId", payment.getId().toString());
        metadata.put("amount", payment.getAmount());
        metadata.put("amountPaid", payment.getAmountPaid());
        metadata.put("status", payment.getStatus().name());
        activityEventRecorder.record(
                payment.getOrganization().getId(),
                payment.getMembership().getId(),
                ActivityEventCategory.BILLING,
                eventType,
                title,
                chargeDescription(payment),
                metadata,
                occurredAt,
                SOURCE_PAYMENT,
                sourceId
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
