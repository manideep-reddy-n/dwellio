package com.dwellio.complaint.repository;

import com.dwellio.domain.entity.Complaint;
import com.dwellio.domain.enums.ComplaintCategory;
import com.dwellio.domain.enums.ComplaintStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.deletedAt IS NULL")
    long countActive();

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.deletedAt IS NULL AND c.status = :status")
    long countActiveByStatus(@Param("status") ComplaintStatus status);

    @Query("""
            SELECT c FROM Complaint c
            JOIN FETCH c.organization o
            JOIN FETCH c.createdByMembership cm
            JOIN FETCH cm.user
            WHERE c.deletedAt IS NULL
              AND (:status IS NULL OR c.status = :status)
              AND (:query IS NULL OR :query = ''
                OR LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(o.name) LIKE LOWER(CONCAT('%', :query, '%')))
            ORDER BY c.createdAt DESC
            """)
    Page<Complaint> searchForAdmin(
            @Param("status") ComplaintStatus status,
            @Param("query") String query,
            Pageable pageable
    );

    @Query("""
            SELECT c FROM Complaint c
            JOIN FETCH c.organization
            JOIN FETCH c.createdByMembership cm
            JOIN FETCH cm.user
            WHERE c.id = :complaintId AND c.deletedAt IS NULL
            """)
    Optional<Complaint> findActiveByIdForAdmin(@Param("complaintId") UUID complaintId);
}
