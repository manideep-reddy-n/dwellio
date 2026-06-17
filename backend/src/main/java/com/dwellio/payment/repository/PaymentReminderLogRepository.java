package com.dwellio.payment.repository;

import com.dwellio.domain.entity.PaymentReminderLog;
import com.dwellio.domain.enums.PaymentReminderType;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentReminderLogRepository extends JpaRepository<PaymentReminderLog, UUID> {

    boolean existsByPaymentIdAndReminderType(UUID paymentId, PaymentReminderType reminderType);
}
