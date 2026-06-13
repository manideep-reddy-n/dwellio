package com.dwellio.complaint.event;

import java.util.UUID;

public record ComplaintReopenedEvent(
        UUID organizationId,
        UUID complaintId,
        String title,
        UUID creatorUserId,
        UUID assigneeUserId
) {
}
