package com.dwellio.complaint.event;

import java.util.UUID;

public record ComplaintCreatedEvent(
        UUID organizationId,
        UUID complaintId,
        String title,
        UUID creatorUserId
) {
}
