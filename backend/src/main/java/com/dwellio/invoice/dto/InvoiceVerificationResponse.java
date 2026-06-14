package com.dwellio.invoice.dto;

import com.dwellio.domain.enums.InvoiceStatus;
import com.dwellio.domain.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record InvoiceVerificationResponse(
        String invoiceNumber,
        String organizationName,
        String residentName,
        LocalDate invoiceDate,
        BigDecimal amount,
        BigDecimal amountPaid,
        PaymentStatus paymentStatus,
        InvoiceStatus verificationStatus,
        String result
) {
}
