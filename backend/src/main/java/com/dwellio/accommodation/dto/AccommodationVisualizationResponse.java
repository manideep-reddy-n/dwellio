package com.dwellio.accommodation.dto;

import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.domain.enums.BedStatus;
import com.dwellio.domain.enums.SpaceStatus;
import com.dwellio.domain.enums.SpaceType;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record AccommodationVisualizationResponse(
        UUID organizationId,
        AccommodationMode accommodationMode,
        List<BuildingNode> buildings
) {

    public record BuildingNode(
            UUID id,
            String name,
            String code,
            List<FloorNode> floors
    ) {
    }

    public record FloorNode(
            UUID id,
            int floorNumber,
            String name,
            List<SpaceNode> spaces
    ) {
    }

    public record SpaceNode(
            UUID id,
            SpaceType spaceType,
            String identifier,
            String displayName,
            SpaceStatus status,
            int capacity,
            boolean blocked,
            List<BedNode> beds,
            OccupantSummary currentOccupant
    ) {
    }

    public record BedNode(
            UUID id,
            String bedLabel,
            BedStatus status,
            boolean blocked,
            OccupantSummary currentOccupant
    ) {
    }

    public record OccupantSummary(
            UUID membershipId,
            String residentName,
            LocalDate moveInDate
    ) {
    }
}
