package com.dwellio.asset.repository;

import com.dwellio.domain.entity.Asset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssetRepository extends JpaRepository<Asset, UUID> {

    @Query("""
            SELECT a FROM Asset a
            WHERE a.organization.id = :organizationId
              AND a.deletedAt IS NULL
            ORDER BY a.name ASC
            """)
    List<Asset> findAllActiveByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT a FROM Asset a
            WHERE a.id = :assetId
              AND a.organization.id = :organizationId
              AND a.deletedAt IS NULL
            """)
    Optional<Asset> findActiveByIdAndOrganizationId(
            @Param("assetId") UUID assetId,
            @Param("organizationId") UUID organizationId
    );
}
