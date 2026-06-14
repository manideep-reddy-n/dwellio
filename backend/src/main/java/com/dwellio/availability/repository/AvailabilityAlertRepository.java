package com.dwellio.availability.repository;

import com.dwellio.domain.entity.AvailabilityAlert;
import com.dwellio.domain.enums.AvailabilityAlertStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AvailabilityAlertRepository extends JpaRepository<AvailabilityAlert, UUID> {

    Optional<AvailabilityAlert> findByUserIdAndOrganizationId(UUID userId, UUID organizationId);

    @Query("""
            SELECT a FROM AvailabilityAlert a
            JOIN FETCH a.organization o
            WHERE a.user.id = :userId
              AND a.status <> 'CANCELLED'
            ORDER BY a.createdAt DESC
            """)
    List<AvailabilityAlert> findActiveByUserId(@Param("userId") UUID userId);

    @Query("""
            SELECT a FROM AvailabilityAlert a
            JOIN FETCH a.user u
            JOIN FETCH a.organization o
            WHERE a.organization.id = :organizationId
              AND a.status = 'PENDING'
            """)
    List<AvailabilityAlert> findPendingByOrganizationId(@Param("organizationId") UUID organizationId);

    boolean existsByUserIdAndOrganizationIdAndStatus(
            UUID userId,
            UUID organizationId,
            AvailabilityAlertStatus status
    );
}
