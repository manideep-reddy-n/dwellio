package com.dwellio.availability.dto;

import com.dwellio.domain.enums.AvailabilityAlertStatus;
import java.time.Instant;
import java.util.UUID;

public record AvailabilityAlertResponse(
        UUID id,
        UUID organizationId,
        String organizationSlug,
        String organizationName,
        AvailabilityAlertStatus status,
        Instant createdAt,
        Instant notifiedAt
) {
}
