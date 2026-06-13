package com.dwellio.occupancy.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record TransferOccupancyRequest(
        @NotNull UUID membershipId,
        UUID targetBedId,
        UUID targetUnitSpaceId,
        @NotNull LocalDate transferDate
) {
}
