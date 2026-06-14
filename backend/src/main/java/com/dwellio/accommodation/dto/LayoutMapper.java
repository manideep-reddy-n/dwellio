package com.dwellio.accommodation.dto;

import com.dwellio.domain.entity.Building;
import com.dwellio.domain.entity.Floor;
import com.dwellio.domain.entity.Space;

public final class LayoutMapper {

    private LayoutMapper() {
    }

    public static LayoutDto toDto(Building building) {
        return new LayoutDto(
                building.getLayoutX(),
                building.getLayoutY(),
                building.getLayoutWidth(),
                building.getLayoutHeight()
        );
    }

    public static LayoutDto toDto(Floor floor) {
        return new LayoutDto(
                floor.getLayoutX(),
                floor.getLayoutY(),
                floor.getLayoutWidth(),
                floor.getLayoutHeight()
        );
    }

    public static LayoutDto toDto(Space space) {
        return new LayoutDto(
                space.getLayoutX(),
                space.getLayoutY(),
                space.getLayoutWidth(),
                space.getLayoutHeight()
        );
    }

    public static void apply(Building building, UpdateAccommodationLayoutRequest.LayoutItem item) {
        if (item.x() != null) {
            building.setLayoutX(item.x());
        }
        if (item.y() != null) {
            building.setLayoutY(item.y());
        }
        if (item.width() != null) {
            building.setLayoutWidth(item.width());
        }
        if (item.height() != null) {
            building.setLayoutHeight(item.height());
        }
    }

    public static void apply(Floor floor, UpdateAccommodationLayoutRequest.LayoutItem item) {
        if (item.x() != null) {
            floor.setLayoutX(item.x());
        }
        if (item.y() != null) {
            floor.setLayoutY(item.y());
        }
        if (item.width() != null) {
            floor.setLayoutWidth(item.width());
        }
        if (item.height() != null) {
            floor.setLayoutHeight(item.height());
        }
    }

    public static void apply(Space space, UpdateAccommodationLayoutRequest.LayoutItem item) {
        if (item.x() != null) {
            space.setLayoutX(item.x());
        }
        if (item.y() != null) {
            space.setLayoutY(item.y());
        }
        if (item.width() != null) {
            space.setLayoutWidth(item.width());
        }
        if (item.height() != null) {
            space.setLayoutHeight(item.height());
        }
    }
}
