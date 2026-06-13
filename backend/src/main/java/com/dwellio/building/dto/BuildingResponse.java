package com.dwellio.building.dto;

import java.util.UUID;

public record BuildingResponse(
        UUID id,
        String name,
        String code
) {
}
