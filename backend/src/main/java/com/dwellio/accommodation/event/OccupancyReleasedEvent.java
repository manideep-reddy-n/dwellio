package com.dwellio.accommodation.event;

import java.util.UUID;

public record OccupancyReleasedEvent(
        UUID organizationId,
        UUID occupancyId,
        UUID membershipId,
        UUID bedId,
        UUID unitSpaceId
) {
}
