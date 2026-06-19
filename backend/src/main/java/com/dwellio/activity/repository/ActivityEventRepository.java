package com.dwellio.activity.repository;

import com.dwellio.domain.entity.ActivityEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ActivityEventRepository extends JpaRepository<ActivityEvent, UUID> {

    @Query("""
            SELECT e FROM ActivityEvent e
            LEFT JOIN FETCH e.membership m
            LEFT JOIN FETCH m.user
            WHERE e.organization.id = :organizationId
            ORDER BY e.occurredAt DESC, e.id DESC
            """)
    List<ActivityEvent> findByOrganization(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT e FROM ActivityEvent e
            LEFT JOIN FETCH e.membership m
            LEFT JOIN FETCH m.user
            WHERE e.organization.id = :organizationId
              AND e.membership.id = :membershipId
            ORDER BY e.occurredAt DESC, e.id DESC
            """)
    List<ActivityEvent> findByOrganizationAndMembership(
            @Param("organizationId") UUID organizationId,
            @Param("membershipId") UUID membershipId
    );

    void deleteByOrganizationId(UUID organizationId);

    boolean existsByOrganizationIdAndEventTypeAndSourceTypeAndSourceId(
            UUID organizationId,
            String eventType,
            String sourceType,
            UUID sourceId
    );

    @Query("""
            SELECT e FROM ActivityEvent e
            JOIN FETCH e.organization o
            LEFT JOIN FETCH e.membership m
            LEFT JOIN FETCH m.user
            WHERE o.deletedAt IS NULL
            ORDER BY e.occurredAt DESC
            """)
    List<ActivityEvent> findRecentPlatformWide(org.springframework.data.domain.Pageable pageable);
}
