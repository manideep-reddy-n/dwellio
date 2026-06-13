package com.dwellio.organization.dto;

import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.OrganizationType;
import java.util.UUID;

public record OrganizationResponse(
        UUID id,
        String slug,
        String name,
        String description,
        OrganizationType type,
        AccommodationMode accommodationMode,
        OrganizationStatus status,
        String city,
        String area,
        String state,
        String postalCode,
        String addressLine,
        String contactPhone,
        String contactEmail,
        String planCode
) {
}
