package com.dwellio.occupancy.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ReleaseOccupancyRequest(
        @NotNull LocalDate moveOutDate
) {
}
