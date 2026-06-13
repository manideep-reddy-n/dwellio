package com.dwellio.metrics.projection.snapshot;

public record UnitAvailabilitySnapshot(
        int totalUnits,
        int blockedUnits,
        int occupiedUnits,
        int availableUnits
) {
}
