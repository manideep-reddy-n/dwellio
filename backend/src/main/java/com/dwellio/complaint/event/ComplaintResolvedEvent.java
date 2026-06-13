package com.dwellio.complaint.event;

import java.util.UUID;

public record ComplaintResolvedEvent(
        UUID organizationId,
        UUID complaintId,
        String title,
        UUID creatorUserId
) {
}
