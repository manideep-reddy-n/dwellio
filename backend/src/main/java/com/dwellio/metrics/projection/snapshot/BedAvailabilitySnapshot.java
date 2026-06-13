package com.dwellio.metrics.projection.snapshot;

public record BedAvailabilitySnapshot(
        int totalBeds,
        int blockedBeds,
        int occupiedBeds,
        int availableBeds
) {
}
