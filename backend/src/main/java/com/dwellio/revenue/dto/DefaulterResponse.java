package com.dwellio.revenue.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DefaulterResponse(
        UUID membershipId,
        String residentName,
        String residentEmail,
        BigDecimal totalOutstanding,
        int overduePaymentCount,
        LocalDate oldestDueDate
) {
}
