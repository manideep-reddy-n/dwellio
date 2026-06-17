package com.dwellio.billing.dto;

import com.dwellio.domain.enums.BillingAppliesTo;
import com.dwellio.domain.enums.BillingRecurrence;
import com.dwellio.domain.enums.BillingResponsibility;
import com.dwellio.domain.enums.ChargeType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpsertBillingRuleRequest(
        @NotNull ChargeType chargeType,
        @NotNull BillingRecurrence recurrence,
        @DecimalMin("0.00") BigDecimal defaultAmount,
        @Min(1) @Max(28) Short dueDayOfMonth,
        @NotNull BillingAppliesTo appliesTo,
        @NotNull BillingResponsibility billTo,
        Boolean active
) {
}
