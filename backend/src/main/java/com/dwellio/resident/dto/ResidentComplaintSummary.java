package com.dwellio.resident.dto;

import com.dwellio.domain.enums.ComplaintCategory;
import com.dwellio.domain.enums.ComplaintPriority;
import com.dwellio.domain.enums.ComplaintStatus;
import java.time.Instant;
import java.util.UUID;

public record ResidentComplaintSummary(
        UUID id,
        String title,
        ComplaintCategory category,
        ComplaintPriority priority,
        ComplaintStatus status,
        Instant createdAt,
        Instant firstResponseAt,
        Instant resolvedAt,
        Boolean slaBreached
) {
}
