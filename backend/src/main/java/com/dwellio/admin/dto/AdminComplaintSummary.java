package com.dwellio.admin.dto;

import com.dwellio.domain.enums.ComplaintCategory;
import com.dwellio.domain.enums.ComplaintPriority;
import com.dwellio.domain.enums.ComplaintStatus;
import java.time.Instant;
import java.util.UUID;

public record AdminComplaintSummary(
        UUID id,
        UUID organizationId,
        String organizationName,
        String title,
        ComplaintCategory category,
        ComplaintPriority priority,
        ComplaintStatus status,
        String createdByName,
        String assignedToName,
        Instant createdAt,
        Instant resolvedAt
) {
}
