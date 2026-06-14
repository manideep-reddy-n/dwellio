package com.dwellio.invoice.dto;

import com.dwellio.domain.enums.InvoiceStatus;
import java.time.Instant;
import java.util.UUID;

public record InvoiceResponse(
        UUID id,
        UUID paymentId,
        String invoiceNumber,
        String verificationToken,
        InvoiceStatus status,
        Instant generatedAt,
        Instant sharedAt,
        String verifyUrl
) {
}
