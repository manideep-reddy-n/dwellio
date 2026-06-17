package com.dwellio.ledger.dto;

import com.dwellio.domain.entity.FinancialLedgerEntry;
import com.dwellio.domain.enums.LedgerEntryType;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record LedgerEntryResponse(
        UUID id,
        UUID membershipId,
        String residentName,
        UUID paymentId,
        LedgerEntryType entryType,
        BigDecimal amount,
        BigDecimal balanceAfter,
        String description,
        LocalDate referenceMonth,
        Instant createdAt
) {
    public static LedgerEntryResponse from(FinancialLedgerEntry entry) {
        return new LedgerEntryResponse(
                entry.getId(),
                entry.getMembership().getId(),
                entry.getMembership().getUser().getFullName(),
                entry.getPayment() != null ? entry.getPayment().getId() : null,
                entry.getEntryType(),
                entry.getAmount(),
                entry.getBalanceAfter(),
                entry.getDescription(),
                entry.getReferenceMonth(),
                entry.getCreatedAt()
        );
    }
}
