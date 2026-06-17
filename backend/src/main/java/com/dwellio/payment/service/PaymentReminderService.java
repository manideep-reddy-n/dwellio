package com.dwellio.payment.service;

import com.dwellio.accommodation.service.AccommodationGuard;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Payment;
import com.dwellio.domain.entity.PaymentReminderLog;
import com.dwellio.domain.enums.NotificationType;
import com.dwellio.domain.enums.PaymentReminderType;
import com.dwellio.domain.enums.PaymentStatus;
import com.dwellio.notification.service.NotificationService;
import com.dwellio.organization.repository.OrganizationRepository;
import com.dwellio.payment.event.PaymentEventPublisher;
import com.dwellio.payment.repository.PaymentReminderLogRepository;
import com.dwellio.payment.repository.PaymentRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentReminderService {

    private final PaymentRepository paymentRepository;
    private final PaymentReminderLogRepository reminderLogRepository;
    private final OrganizationRepository organizationRepository;
    private final NotificationService notificationService;
    private final AccommodationGuard accommodationGuard;
    private final PaymentEventPublisher paymentEventPublisher;
    private final Clock clock;

    @Transactional
    public void sendScheduledReminders() {
        LocalDate today = LocalDate.now(clock);
        organizationRepository.findAllActive().forEach(org -> processOrganization(org, today));
    }

    private void processOrganization(Organization organization, LocalDate today) {
        List<Payment> payments = paymentRepository.findAllActiveByOrganizationId(organization.getId());
        boolean metricsChanged = false;

        for (Payment payment : payments) {
            if (payment.getStatus() == PaymentStatus.PAID) {
                continue;
            }
            if (payment.getAmountPaid().compareTo(payment.getAmount()) >= 0) {
                continue;
            }

            LocalDate dueDate = payment.getDueDate();
            if (dueDate.equals(today.plusDays(5))) {
                metricsChanged |= sendReminder(organization, payment, PaymentReminderType.FIVE_DAYS_BEFORE, "Payment due in 5 days");
            } else if (dueDate.equals(today)) {
                metricsChanged |= sendReminder(organization, payment, PaymentReminderType.DUE_TODAY, "Payment due today");
            } else if (dueDate.isBefore(today)) {
                metricsChanged |= sendReminder(organization, payment, PaymentReminderType.OVERDUE, "Payment overdue");
            }
        }

        if (metricsChanged) {
            paymentEventPublisher.publishMetricsChanged(organization.getId());
        }
    }

    private boolean sendReminder(
            Organization organization,
            Payment payment,
            PaymentReminderType type,
            String title
    ) {
        if (reminderLogRepository.existsByPaymentIdAndReminderType(payment.getId(), type)) {
            return false;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("paymentId", payment.getId().toString());
        payload.put("organizationSlug", organization.getSlug());
        payload.put("targetPath", "/app/" + organization.getSlug() + "/resident/payments");
        payload.put("billingMonth", payment.getBillingMonth().toString());
        payload.put("reminderType", type.name());

        notificationService.create(
                payment.getMembership().getUser().getId(),
                organization.getId(),
                NotificationType.PAYMENT_DUE,
                title,
                (payment.getDescription() != null ? payment.getDescription() : payment.getChargeType().name())
                        + " — ₹" + payment.getAmount() + " due by " + payment.getDueDate() + ".",
                payload
        );

        PaymentReminderLog log = new PaymentReminderLog();
        log.setId(UUID.randomUUID());
        log.setPayment(payment);
        log.setReminderType(type);
        log.setSentAt(Instant.now(clock));
        reminderLogRepository.save(log);
        return type == PaymentReminderType.OVERDUE;
    }
}
