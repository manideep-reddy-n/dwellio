package com.dwellio.space.dto;

import com.dwellio.domain.enums.SpaceStatus;
import com.dwellio.domain.enums.SpaceType;
import java.util.UUID;

public record SpaceResponse(
        UUID id,
        UUID floorId,
        SpaceType spaceType,
        String identifier,
        String displayName,
        SpaceStatus status,
        int capacity,
        boolean blocked
) {
}
