package com.dwellio.joinrequest.dto;

import com.dwellio.domain.enums.JoinRequestStatus;
import java.time.Instant;
import java.util.UUID;

public record JoinRequestResponse(
        UUID id,
        UUID userId,
        String userEmail,
        String userFullName,
        String userPhone,
        JoinRequestStatus status,
        String message,
        String emergencyContactName,
        String emergencyContactPhone,
        Instant createdAt,
        Instant reviewedAt,
        String rejectionReason
) {
}
