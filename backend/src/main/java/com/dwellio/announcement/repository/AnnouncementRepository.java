package com.dwellio.announcement.repository;

import com.dwellio.domain.entity.Announcement;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {

    @Query("""
            SELECT a FROM Announcement a
            WHERE a.organization.id = :organizationId
              AND a.deletedAt IS NULL
            ORDER BY a.createdAt DESC
            """)
    List<Announcement> findAllActiveByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT a FROM Announcement a
            WHERE a.organization.id = :organizationId
              AND a.publishedAt IS NOT NULL
              AND a.deletedAt IS NULL
            ORDER BY a.publishedAt DESC
            """)
    List<Announcement> findAllPublishedByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT a FROM Announcement a
            WHERE a.id = :announcementId
              AND a.organization.id = :organizationId
              AND a.deletedAt IS NULL
            """)
    Optional<Announcement> findActiveByIdAndOrganizationId(
            @Param("announcementId") UUID announcementId,
            @Param("organizationId") UUID organizationId
    );
}
