package com.dwellio.floor.dto;

import java.util.UUID;

public record FloorResponse(
        UUID id,
        UUID buildingId,
        int floorNumber,
        String name
) {
}
