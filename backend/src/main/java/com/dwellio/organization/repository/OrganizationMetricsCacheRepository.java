package com.dwellio.organization.repository;

import com.dwellio.domain.entity.OrganizationMetricsCache;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OrganizationMetricsCacheRepository extends JpaRepository<OrganizationMetricsCache, UUID> {

    @Query("""
            SELECT c FROM OrganizationMetricsCache c
            JOIN FETCH c.organization o
            WHERE o.deletedAt IS NULL
            ORDER BY o.name ASC
            """)
    List<OrganizationMetricsCache> findAllWithActiveOrganizations();
}
