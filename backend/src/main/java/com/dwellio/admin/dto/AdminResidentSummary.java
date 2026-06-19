package com.dwellio.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminResidentSummary(
        UUID membershipId,
        UUID userId,
        String fullName,
        String email,
        UUID organizationId,
        String organizationName,
        String organizationSlug,
        Instant joinedAt
) {
}
