package com.dwellio.review.event;

import java.util.UUID;

public record ReviewReportedEvent(
        UUID organizationId,
        UUID reviewId,
        UUID reporterUserId
) {
}
