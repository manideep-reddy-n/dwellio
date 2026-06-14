package com.dwellio.verification.security;

import com.dwellio.verification.repository.OrganizationVerificationDocumentRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component("verificationDocumentAuth")
@RequiredArgsConstructor
public class VerificationDocumentAuthorization {

    private final OrganizationVerificationDocumentRepository documentRepository;

    public UUID organizationId(UUID documentId) {
        return documentRepository.findByIdWithOrganization(documentId)
                .map(document -> document.getOrganization().getId())
                .orElse(documentId);
    }
}
