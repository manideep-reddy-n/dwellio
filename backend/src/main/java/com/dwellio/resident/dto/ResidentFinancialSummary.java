package com.dwellio.resident.dto;

import java.math.BigDecimal;

public record ResidentFinancialSummary(
        BigDecimal outstandingBalance,
        int pendingPaymentsCount,
        BigDecimal totalBilled,
        BigDecimal totalPaid
) {
}
