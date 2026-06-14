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
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.notification.repository.NotificationRepository;
import com.dwellio.notification.service.NotificationService;
import com.dwellio.occupancy.repository.OccupancyRepository;
import com.dwellio.organization.repository.OrganizationRepository;
import com.dwellio.payment.dto.CreateManualChargeRequest;
import com.dwellio.payment.dto.PaymentResponse;
import com.dwellio.payment.dto.RecordPaymentRequest;
import com.dwellio.payment.repository.PaymentRepository;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final NotificationRepository notificationRepository;
    private final MembershipRepository membershipRepository;
    private final OccupancyRepository occupancyRepository;
    private final OrganizationRepository organizationRepository;
    private final NotificationService notificationService;
    private final AccommodationGuard accommodationGuard;
    private final AuthorizationService authorizationService;
    private final Clock clock;

    @Transactional
    public List<PaymentResponse> listForOrganization(UUID organizationId) {
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        syncMonthlyPayments(organization);
        return paymentRepository.findAllActiveByOrganizationId(organizationId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<PaymentResponse> listMine(UUID organizationId) {
        MembershipContext context = authorizationService.requirePermission(organizationId, "payment:read_own");
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        syncMonthlyPayments(organization);
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

        BigDecimal amountPaid = request.amountPaid() != null ? request.amountPaid() : BigDecimal.ZERO;
        if (amountPaid.compareTo(payment.getAmount()) > 0) {
            throw new BadRequestException("Paid amount cannot exceed due amount");
        }

        payment.setAmountPaid(amountPaid);
        payment.setStatus(resolveStatus(payment.getAmount(), amountPaid, request.status()));
        payment.setNotes(request.notes());
        payment.setPaidAt(payment.getStatus() == PaymentStatus.PAID ? Instant.now(clock) : null);
        payment.setRecordedBy(referenceUser(principal.getId()));

        return toResponse(paymentRepository.save(payment));
    }

    @Transactional
    public void syncAllOrganizations() {
        organizationRepository.findAllActive().forEach(this::syncMonthlyPayments);
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
        return paymentRepository.save(payment);
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
                paymentRepository.save(payment);
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
                payment.setStatus(next);
                paymentRepository.save(payment);
                if (next == PaymentStatus.OVERDUE) {
                    notifyPaymentDue(organization, payment);
                }
            }
        }
    }

    private PaymentResponse toResponse(Payment payment) {
        Invoice invoice = invoiceRepository.findActiveByPaymentId(payment.getId()).orElse(null);
        return new PaymentResponse(
                payment.getId(),
                payment.getMembership().getId(),
                payment.getMembership().getUser().getFullName(),
                payment.getMembership().getUser().getEmail(),
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
        if (paid.compareTo(due) >= 0 || requested == PaymentStatus.PAID) {
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

    private void notifyPaymentDue(Organization organization, Payment payment) {
        UUID userId = payment.getMembership().getUser().getId();
        Instant since = Instant.now(clock).minus(1, ChronoUnit.DAYS);
        if (notificationRepository.existsRecentForPayment(
                userId,
                organization.getId(),
                NotificationType.PAYMENT_DUE.name(),
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
}
