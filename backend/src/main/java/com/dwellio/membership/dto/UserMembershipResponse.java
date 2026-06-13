package com.dwellio.membership.dto;

import com.dwellio.domain.enums.AccommodationMode;
import java.util.List;
import java.util.UUID;

public record UserMembershipResponse(
        UUID membershipId,
        UUID organizationId,
        String organizationSlug,
        String organizationName,
        AccommodationMode accommodationMode,
        String roleName,
        boolean ownerRole,
        List<String> permissions
) {
}
