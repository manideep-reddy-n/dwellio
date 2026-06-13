package com.dwellio.marketplace.dto;

import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.domain.enums.OrganizationType;
import java.util.UUID;

public record PublicOrganizationResponse(
        UUID id,
        String slug,
        String name,
        String description,
        OrganizationType type,
        AccommodationMode accommodationMode,
        String city,
        String area,
        String contactPhone,
        String contactEmail
) {
    public static PublicOrganizationResponse from(Organization organization) {
        return new PublicOrganizationResponse(
                organization.getId(),
                organization.getSlug(),
                organization.getName(),
                organization.getDescription(),
                organization.getType(),
                organization.getAccommodationMode(),
                organization.getCity(),
                organization.getArea(),
                organization.getContactPhone(),
                organization.getContactEmail()
        );
    }
}
