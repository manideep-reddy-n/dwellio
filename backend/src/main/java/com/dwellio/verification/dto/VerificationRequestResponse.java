package com.dwellio.verification.dto;

import com.dwellio.domain.entity.OrganizationVerificationDocument;
import com.dwellio.domain.entity.OrganizationVerificationRequest;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.VerificationRequestStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record VerificationRequestResponse(
        UUID id,
        UUID organizationId,
        String organizationName,
        String organizationSlug,
        OrganizationStatus organizationStatus,
        UUID submittedByMembershipId,
        VerificationRequestStatus status,
        String rejectionReason,
        Instant submittedAt,
        Instant reviewedAt,
        UUID reviewedByUserId,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        List<VerificationDocumentResponse> documents
) {
    public static VerificationRequestResponse from(
            OrganizationVerificationRequest request,
            List<OrganizationVerificationDocument> documents
    ) {
        return new VerificationRequestResponse(
                request.getId(),
                request.getOrganization().getId(),
                request.getOrganization().getName(),
                request.getOrganization().getSlug(),
                request.getOrganization().getStatus(),
                request.getSubmittedByMembership().getId(),
                request.getStatus(),
                request.getRejectionReason(),
                request.getSubmittedAt(),
                request.getReviewedAt(),
                request.getReviewedBy() != null ? request.getReviewedBy().getId() : null,
                request.getNotes(),
                request.getCreatedAt(),
                request.getUpdatedAt(),
                documents.stream().map(VerificationDocumentResponse::from).toList()
        );
    }
}
