package com.dwellio.complaint.repository;

import com.dwellio.domain.entity.Complaint;
import com.dwellio.domain.enums.ComplaintCategory;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {

    @Query("""
            SELECT c FROM Complaint c
            JOIN FETCH c.createdByMembership
            WHERE c.organization.id = :organizationId
              AND c.deletedAt IS NULL
              AND (:category IS NULL OR c.category = :category)
            ORDER BY c.createdAt DESC
            """)
    List<Complaint> findAllActiveByOrganizationId(
            @Param("organizationId") UUID organizationId,
            @Param("category") ComplaintCategory category
    );

    @Query("""
            SELECT c FROM Complaint c
            WHERE c.organization.id = :organizationId
              AND c.createdByMembership.id = :membershipId
              AND c.deletedAt IS NULL
              AND (:category IS NULL OR c.category = :category)
            ORDER BY c.createdAt DESC
            """)
    List<Complaint> findAllActiveByOrganizationIdAndCreatedByMembershipId(
            @Param("organizationId") UUID organizationId,
            @Param("membershipId") UUID membershipId,
            @Param("category") ComplaintCategory category
    );

    @Query("""
            SELECT c FROM Complaint c
            WHERE c.id = :complaintId
              AND c.organization.id = :organizationId
              AND c.deletedAt IS NULL
            """)
    Optional<Complaint> findActiveByIdAndOrganizationId(
            @Param("complaintId") UUID complaintId,
            @Param("organizationId") UUID organizationId
    );
}
