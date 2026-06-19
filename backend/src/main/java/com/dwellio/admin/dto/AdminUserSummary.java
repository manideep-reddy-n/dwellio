package com.dwellio.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminUserSummary(
        UUID id,
        String email,
        String fullName,
        String phone,
        boolean platformAdmin,
        boolean active,
        boolean emailVerified,
        Instant createdAt,
        Instant deletedAt
) {
}
