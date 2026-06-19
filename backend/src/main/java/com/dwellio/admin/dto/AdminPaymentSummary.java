package com.dwellio.admin.dto;

import com.dwellio.domain.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AdminPaymentSummary(
        UUID id,
        UUID organizationId,
        String organizationName,
        String residentName,
        LocalDate billingMonth,
        BigDecimal amount,
        BigDecimal amountPaid,
        PaymentStatus status,
        LocalDate dueDate,
        Instant createdAt
) {
}
