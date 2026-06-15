package com.dwellio.membership.dto;

public record ResidentProfileResponse(
        String organizationSlug,
        String organizationName,
        String membershipId,
        String emergencyContactName,
        String emergencyContactPhone
) {
}
