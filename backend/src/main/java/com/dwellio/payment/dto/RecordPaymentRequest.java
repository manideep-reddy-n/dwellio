package com.dwellio.payment.dto;

import com.dwellio.domain.enums.PaymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record RecordPaymentRequest(
        @NotNull PaymentStatus status,
        @DecimalMin("0.0") BigDecimal amountPaid,
        String notes
) {
}
