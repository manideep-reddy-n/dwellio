package com.dwellio.organization.dto;

import com.dwellio.domain.entity.OrganizationSuspensionAppeal;
import com.dwellio.domain.enums.SuspensionAppealStatus;
import java.time.Instant;
import java.util.UUID;

public record SuspensionAppealResponse(
        UUID id,
        UUID organizationId,
        String reason,
        SuspensionAppealStatus status,
        String adminNotes,
        Instant reviewedAt,
        Instant createdAt
) {
    public static SuspensionAppealResponse from(OrganizationSuspensionAppeal appeal) {
        return new SuspensionAppealResponse(
                appeal.getId(),
                appeal.getOrganization().getId(),
                appeal.getReason(),
                appeal.getStatus(),
                appeal.getAdminNotes(),
                appeal.getReviewedAt(),
                appeal.getCreatedAt()
        );
    }
}
