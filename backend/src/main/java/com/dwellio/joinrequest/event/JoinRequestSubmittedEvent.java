package com.dwellio.joinrequest.event;

import java.util.UUID;

public record JoinRequestSubmittedEvent(
        UUID organizationId,
        UUID joinRequestId,
        UUID applicantUserId,
        String applicantName,
        String organizationName,
        String organizationSlug
) {
}
