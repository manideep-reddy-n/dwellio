package com.dwellio.billing.dto;

import com.dwellio.domain.entity.BillingRule;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Space;
import com.dwellio.domain.enums.BillingAppliesTo;
import com.dwellio.domain.enums.BillingRecurrence;
import com.dwellio.domain.enums.BillingResponsibility;
import com.dwellio.domain.enums.ChargeType;
import java.math.BigDecimal;
import java.util.UUID;

public record BillingRuleResponse(
        UUID id,
        ChargeType chargeType,
        BillingRecurrence recurrence,
        BigDecimal defaultAmount,
        Short dueDayOfMonth,
        BillingAppliesTo appliesTo,
        BillingResponsibility billTo,
        boolean active
) {
    public static BillingRuleResponse from(BillingRule rule) {
        return new BillingRuleResponse(
                rule.getId(),
                rule.getChargeType(),
                rule.getRecurrence(),
                rule.getDefaultAmount(),
                rule.getDueDayOfMonth(),
                rule.getAppliesTo(),
                rule.getBillTo(),
                rule.isActive()
        );
    }
}
