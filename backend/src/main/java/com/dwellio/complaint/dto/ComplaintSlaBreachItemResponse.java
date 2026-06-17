package com.dwellio.complaint.dto;

import com.dwellio.complaint.sla.ComplaintSlaBreachType;
import com.dwellio.domain.enums.ComplaintCategory;
import com.dwellio.domain.enums.ComplaintPriority;
import com.dwellio.domain.enums.ComplaintStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ComplaintSlaBreachItemResponse(
        UUID id,
        String title,
        ComplaintStatus status,
        ComplaintCategory category,
        ComplaintPriority priority,
        Instant createdAt,
        Instant firstResponseAt,
        Instant resolvedAt,
        List<ComplaintSlaBreachType> breachTypes
) {
}
