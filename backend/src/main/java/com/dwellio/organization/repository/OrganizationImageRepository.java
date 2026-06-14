package com.dwellio.organization.repository;

import com.dwellio.domain.entity.OrganizationImage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrganizationImageRepository extends JpaRepository<OrganizationImage, UUID> {

    @Query("""
            SELECT i FROM OrganizationImage i
            WHERE i.organization.id = :organizationId AND i.deletedAt IS NULL
            ORDER BY i.sortOrder ASC, i.createdAt ASC
            """)
    List<OrganizationImage> findAllActiveByOrganizationId(@Param("organizationId") UUID organizationId);
}
