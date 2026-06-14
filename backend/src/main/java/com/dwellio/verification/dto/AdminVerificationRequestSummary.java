package com.dwellio.verification.dto;

import com.dwellio.domain.entity.OrganizationVerificationDocument;
import com.dwellio.domain.entity.OrganizationVerificationRequest;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.OrganizationType;
import com.dwellio.domain.enums.VerificationRequestStatus;
import java.time.Instant;
import java.util.UUID;

public record AdminVerificationRequestSummary(
        UUID id,
        UUID organizationId,
        String organizationName,
        String organizationSlug,
        OrganizationType organizationType,
        OrganizationStatus organizationStatus,
        VerificationRequestStatus status,
        Instant submittedAt,
        int documentCount
) {
    public static AdminVerificationRequestSummary from(
            OrganizationVerificationRequest request,
            int documentCount
    ) {
        return new AdminVerificationRequestSummary(
                request.getId(),
                request.getOrganization().getId(),
                request.getOrganization().getName(),
                request.getOrganization().getSlug(),
                request.getOrganization().getType(),
                request.getOrganization().getStatus(),
                request.getStatus(),
                request.getSubmittedAt(),
                documentCount
        );
    }
}
