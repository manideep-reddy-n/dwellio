package com.dwellio.organization.repository;

import com.dwellio.domain.entity.OrganizationMetricsCache;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationMetricsCacheRepository extends JpaRepository<OrganizationMetricsCache, UUID> {
}
