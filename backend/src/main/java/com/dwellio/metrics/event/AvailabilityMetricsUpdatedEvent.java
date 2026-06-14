package com.dwellio.metrics.event;

import java.util.UUID;

public record AvailabilityMetricsUpdatedEvent(
        UUID organizationId,
        Integer availableBeds,
        Integer availableUnits
) {
}
