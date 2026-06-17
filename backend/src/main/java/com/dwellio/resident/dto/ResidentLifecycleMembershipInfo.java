package com.dwellio.resident.dto;

import com.dwellio.domain.enums.MembershipStatus;
import java.time.Instant;
import java.util.UUID;

public record ResidentLifecycleMembershipInfo(
        UUID id,
        UUID userId,
        String userFullName,
        String userEmail,
        String userPhone,
        String roleName,
        MembershipStatus status,
        Instant joinedAt,
        String emergencyContactName,
        String emergencyContactPhone
) {
}
