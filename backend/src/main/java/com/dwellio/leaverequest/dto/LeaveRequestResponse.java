package com.dwellio.leaverequest.dto;

import com.dwellio.domain.enums.LeaveRequestStatus;
import java.time.Instant;
import java.util.UUID;

public record LeaveRequestResponse(
        UUID id,
        UUID membershipId,
        UUID userId,
        String userFullName,
        String userEmail,
        LeaveRequestStatus status,
        String reason,
        Instant createdAt,
        Instant reviewedAt
) {
}
