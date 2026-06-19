package com.dwellio.admin.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AdminAuditLogSummary(
        UUID id,
        String actorName,
        String action,
        String entityType,
        UUID entityId,
        String organizationName,
        Map<String, Object> metadata,
        Instant createdAt
) {
}
