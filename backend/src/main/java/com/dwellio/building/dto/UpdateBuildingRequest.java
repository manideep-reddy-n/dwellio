package com.dwellio.building.dto;

import jakarta.validation.constraints.Size;

public record UpdateBuildingRequest(
        @Size(max = 255) String name,
        @Size(max = 50) String code
) {
}
