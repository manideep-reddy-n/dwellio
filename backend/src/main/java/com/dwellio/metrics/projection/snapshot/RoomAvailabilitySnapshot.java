package com.dwellio.metrics.projection.snapshot;

public record RoomAvailabilitySnapshot(
        int totalRooms,
        int vacantRooms,
        int partialRooms,
        int occupiedRooms,
        int blockedRooms
) {
}
