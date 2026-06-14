package com.dwellio.verification.dto;

import com.dwellio.domain.entity.OrganizationVerificationDocument;
import com.dwellio.domain.enums.VerificationDocumentType;
import com.dwellio.domain.enums.VerificationRequestStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record VerificationDocumentResponse(
        UUID id,
        VerificationDocumentType documentType,
        String fileUrl,
        Instant uploadedAt
) {
    public static VerificationDocumentResponse from(OrganizationVerificationDocument document) {
        return new VerificationDocumentResponse(
                document.getId(),
                document.getDocumentType(),
                document.getFileUrl(),
                document.getUploadedAt()
        );
    }
}
