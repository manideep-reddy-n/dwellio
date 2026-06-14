package com.dwellio.payment.dto;

import com.dwellio.domain.enums.ChargeType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateManualChargeRequest(
        @NotNull ChargeType chargeType,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @Size(max = 500) String description,
        @NotNull LocalDate dueDate,
        @NotEmpty List<UUID> membershipIds
) {
}
