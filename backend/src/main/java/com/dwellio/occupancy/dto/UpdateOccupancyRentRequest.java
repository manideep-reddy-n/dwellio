package com.dwellio.occupancy.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdateOccupancyRentRequest(
        @NotNull @DecimalMin("0.01") BigDecimal monthlyRent
) {
}
