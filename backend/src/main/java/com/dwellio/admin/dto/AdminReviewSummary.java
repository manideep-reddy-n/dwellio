package com.dwellio.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminReviewSummary(
        UUID id,
        UUID organizationId,
        String organizationName,
        String authorName,
        short rating,
        String body,
        boolean hidden,
        Instant createdAt
) {
}
