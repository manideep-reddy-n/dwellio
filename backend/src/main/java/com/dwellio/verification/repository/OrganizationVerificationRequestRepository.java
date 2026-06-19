package com.dwellio.verification.repository;

import com.dwellio.domain.entity.OrganizationVerificationRequest;
import com.dwellio.domain.enums.VerificationRequestStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrganizationVerificationRequestRepository
        extends JpaRepository<OrganizationVerificationRequest, UUID> {

    @Query("""
            SELECT r FROM OrganizationVerificationRequest r
            WHERE r.organization.id = :organizationId
            ORDER BY r.createdAt DESC
            """)
    List<OrganizationVerificationRequest> findAllByOrganizationIdOrderByCreatedAtDesc(
            @Param("organizationId") UUID organizationId
    );

    Optional<OrganizationVerificationRequest> findFirstByOrganization_IdOrderByCreatedAtDesc(
            UUID organizationId
    );

    @Query("""
            SELECT r FROM OrganizationVerificationRequest r
            JOIN FETCH r.organization
            ORDER BY r.submittedAt DESC, r.createdAt DESC
            """)
    List<OrganizationVerificationRequest> findAllWithOrganization();

    @Query("""
            SELECT COUNT(r) > 0 FROM OrganizationVerificationRequest r
            WHERE r.organization.id = :organizationId
            AND r.status = :status
            """)
    boolean existsByOrganizationIdAndStatus(
            @Param("organizationId") UUID organizationId,
            @Param("status") VerificationRequestStatus status
    );

    @Query("""
            SELECT COUNT(r) FROM OrganizationVerificationRequest r
            WHERE r.status = :status AND r.submittedAt IS NOT NULL
            """)
    long countByStatus(@Param("status") VerificationRequestStatus status);
}
