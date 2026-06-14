package com.dwellio.payment.dto;

import com.dwellio.domain.enums.ChargeType;
import com.dwellio.domain.enums.InvoiceStatus;
import com.dwellio.domain.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        UUID membershipId,
        String residentName,
        String residentEmail,
        LocalDate billingMonth,
        BigDecimal amount,
        BigDecimal amountPaid,
        LocalDate dueDate,
        PaymentStatus status,
        ChargeType chargeType,
        String description,
        String notes,
        Instant paidAt,
        UUID invoiceId,
        String invoiceNumber,
        InvoiceStatus invoiceStatus,
        boolean invoiceShared
) {
}
