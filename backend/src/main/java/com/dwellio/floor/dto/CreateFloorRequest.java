package com.dwellio.floor.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateFloorRequest(
        @NotNull Integer floorNumber,
        @Size(max = 100) String name
) {
}
