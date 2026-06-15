package com.dwellio.membership.dto;

import com.dwellio.domain.enums.MembershipStatus;
import java.time.Instant;
import java.util.UUID;

public record MembershipResponse(
        UUID id,
        UUID userId,
        String userEmail,
        String userFullName,
        UUID roleId,
        String roleName,
        String userPhone,
        MembershipStatus status,
        Instant joinedAt
) {
}
