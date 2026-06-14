package com.dwellio.occupancy.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AllocateOccupancyRequest(
        @NotNull UUID membershipId,
        UUID bedId,
        UUID unitSpaceId,
        @NotNull LocalDate moveInDate,
        BigDecimal monthlyRent
) {
}
