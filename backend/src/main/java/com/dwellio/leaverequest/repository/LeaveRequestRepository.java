package com.dwellio.leaverequest.repository;

import com.dwellio.domain.entity.LeaveRequest;
import com.dwellio.domain.enums.LeaveRequestStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {

    @Query("""
            SELECT lr FROM LeaveRequest lr
            JOIN FETCH lr.user
            JOIN FETCH lr.membership m
            JOIN FETCH m.role
            WHERE lr.organization.id = :organizationId
            ORDER BY lr.createdAt DESC
            """)
    List<LeaveRequest> findAllByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT lr FROM LeaveRequest lr
            WHERE lr.user.id = :userId
              AND lr.organization.id = :organizationId
              AND lr.status = :status
            """)
    Optional<LeaveRequest> findPendingByUserAndOrganization(
            @Param("userId") UUID userId,
            @Param("organizationId") UUID organizationId,
            @Param("status") LeaveRequestStatus status
    );

    @Query("""
            SELECT lr FROM LeaveRequest lr
            JOIN FETCH lr.user
            JOIN FETCH lr.membership
            WHERE lr.id = :id AND lr.organization.id = :organizationId
            """)
    Optional<LeaveRequest> findByIdAndOrganizationId(@Param("id") UUID id, @Param("organizationId") UUID organizationId);
}
