package com.dwellio.organization.repository;

import com.dwellio.domain.entity.OrganizationSuspensionAppeal;
import com.dwellio.domain.enums.SuspensionAppealStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrganizationSuspensionAppealRepository
        extends JpaRepository<OrganizationSuspensionAppeal, UUID> {

    @Query("""
            SELECT a FROM OrganizationSuspensionAppeal a
            WHERE a.organization.id = :organizationId
            ORDER BY a.createdAt DESC
            """)
    List<OrganizationSuspensionAppeal> findAllByOrganizationId(@Param("organizationId") UUID organizationId);

    Optional<OrganizationSuspensionAppeal> findFirstByOrganization_IdAndStatusOrderByCreatedAtDesc(
            UUID organizationId,
            SuspensionAppealStatus status
    );
}
