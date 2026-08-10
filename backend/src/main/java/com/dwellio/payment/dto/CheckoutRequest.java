package com.dwellio.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CheckoutRequest(
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.0", message = "Minimum payment amount is 1")
    BigDecimal amount
) {}
