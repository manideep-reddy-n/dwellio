package com.dwellio.complaint.event;

import java.util.UUID;

public record ComplaintAssignedEvent(
        UUID organizationId,
        UUID complaintId,
        String title,
        UUID assigneeUserId
) {
}
