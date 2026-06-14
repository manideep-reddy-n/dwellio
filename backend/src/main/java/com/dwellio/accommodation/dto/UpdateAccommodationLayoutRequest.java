package com.dwellio.accommodation.dto;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

public record UpdateAccommodationLayoutRequest(
        @Valid List<LayoutItem> buildings,
        @Valid List<LayoutItem> floors,
        @Valid List<LayoutItem> spaces
) {

    public record LayoutItem(
            UUID id,
            Double x,
            Double y,
            Double width,
            Double height
    ) {
    }
}
