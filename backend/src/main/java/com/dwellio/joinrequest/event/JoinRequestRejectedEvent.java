package com.dwellio.joinrequest.event;

import java.util.UUID;

public record JoinRequestRejectedEvent(
        UUID organizationId,
        UUID joinRequestId,
        UUID userId,
        String organizationName,
        String rejectionReason
) {
}
