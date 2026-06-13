package com.dwellio.floor.dto;

import jakarta.validation.constraints.Size;

public record UpdateFloorRequest(
        Integer floorNumber,
        @Size(max = 100) String name
) {
}
