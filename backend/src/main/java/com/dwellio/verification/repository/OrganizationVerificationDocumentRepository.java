package com.dwellio.verification.repository;

import com.dwellio.domain.entity.OrganizationVerificationDocument;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrganizationVerificationDocumentRepository
        extends JpaRepository<OrganizationVerificationDocument, UUID> {

    @Query("""
            SELECT d FROM OrganizationVerificationDocument d
            WHERE d.organization.id = :organizationId
            AND d.verificationRequest IS NULL
            ORDER BY d.uploadedAt ASC
            """)
    List<OrganizationVerificationDocument> findDraftByOrganizationId(
            @Param("organizationId") UUID organizationId
    );

    @Query("""
            SELECT d FROM OrganizationVerificationDocument d
            WHERE d.verificationRequest.id = :requestId
            ORDER BY d.uploadedAt ASC
            """)
    List<OrganizationVerificationDocument> findByVerificationRequestId(
            @Param("requestId") UUID requestId
    );

    @Query("""
            SELECT d FROM OrganizationVerificationDocument d
            WHERE d.id = :documentId
            """)
    Optional<OrganizationVerificationDocument> findByIdWithOrganization(
            @Param("documentId") UUID documentId
    );

    @Query("""
            SELECT COUNT(d) FROM OrganizationVerificationDocument d
            WHERE d.organization.id = :organizationId
            AND (d.verificationRequest IS NULL OR d.verificationRequest.id = :requestId)
            """)
    long countForSubmission(
            @Param("organizationId") UUID organizationId,
            @Param("requestId") UUID requestId
    );
}
