package com.dwellio.domain.enums;

public final class OrganizationTypeMapping {

    private OrganizationTypeMapping() {
    }

    public static AccommodationMode defaultAccommodationMode(OrganizationType type) {
        return switch (type) {
            case HOSTEL, PG, CO_LIVING -> AccommodationMode.BED_BASED;
            case GATED_COMMUNITY -> AccommodationMode.UNIT_BASED;
        };
    }
}
