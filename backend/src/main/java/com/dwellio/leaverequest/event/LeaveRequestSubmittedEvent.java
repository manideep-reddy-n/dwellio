package com.dwellio.leaverequest.event;

import java.util.UUID;

public record LeaveRequestSubmittedEvent(
        UUID organizationId,
        UUID leaveRequestId,
        UUID residentUserId,
        String residentName,
        String organizationName,
        String organizationSlug
) {
}
