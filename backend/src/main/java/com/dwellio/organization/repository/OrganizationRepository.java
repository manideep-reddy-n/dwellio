package com.dwellio.organization.repository;

import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.OrganizationType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

    @Query("SELECT o FROM Organization o WHERE o.id = :id AND o.deletedAt IS NULL")
    Optional<Organization> findActiveById(@Param("id") UUID id);

    @Query("SELECT o FROM Organization o WHERE o.slug = :slug AND o.deletedAt IS NULL")
    Optional<Organization> findActiveBySlug(@Param("slug") String slug);

    @Query("SELECT COUNT(o) > 0 FROM Organization o WHERE o.slug = :slug AND o.deletedAt IS NULL")
    boolean existsActiveBySlug(@Param("slug") String slug);

    @Query("SELECT o FROM Organization o WHERE o.deletedAt IS NULL")
    List<Organization> findAllActive();

    @Query("""
            SELECT o FROM Organization o
            LEFT JOIN OrganizationMetricsCache c ON c.organizationId = o.id
            WHERE o.deletedAt IS NULL
              AND o.status = :status
              AND (:city = '' OR LOWER(o.city) = LOWER(:city))
              AND (:type IS NULL OR o.type = :type)
              AND (
                :query = ''
                OR LOWER(o.name) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(o.city) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(COALESCE(o.area, '')) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            ORDER BY c.searchRankScore DESC NULLS LAST, o.name ASC
            """)
    List<Organization> searchMarketplace(
            @Param("status") OrganizationStatus status,
            @Param("city") String city,
            @Param("type") OrganizationType type,
            @Param("query") String query
    );

    @Query("SELECT COUNT(o) FROM Organization o WHERE o.deletedAt IS NULL")
    long countActive();

    @Query("SELECT COUNT(o) FROM Organization o WHERE o.deletedAt IS NULL AND o.status = :status")
    long countActiveByStatus(@Param("status") OrganizationStatus status);

    @Query("SELECT COUNT(o) FROM Organization o WHERE o.createdAt >= :since")
    long countCreatedSince(@Param("since") java.time.Instant since);

    @Query("SELECT COUNT(o) FROM Organization o WHERE o.deletedAt IS NULL AND o.status = com.dwellio.domain.enums.OrganizationStatus.SUSPENDED")
    long countSuspended();
}
