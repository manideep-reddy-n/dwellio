package com.dwellio.accommodation.event;

import java.util.UUID;

public record OccupancyAllocatedEvent(
        UUID organizationId,
        UUID occupancyId,
        UUID membershipId,
        UUID bedId,
        UUID unitSpaceId
) {
}
