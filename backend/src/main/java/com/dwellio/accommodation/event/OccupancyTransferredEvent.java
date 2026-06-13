package com.dwellio.accommodation.event;

import java.util.UUID;

public record OccupancyTransferredEvent(
        UUID organizationId,
        UUID membershipId,
        UUID userId,
        UUID previousOccupancyId,
        UUID newOccupancyId,
        UUID previousBedId,
        UUID newBedId,
        UUID previousUnitSpaceId,
        UUID newUnitSpaceId
) {
}
