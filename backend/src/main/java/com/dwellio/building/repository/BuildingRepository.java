package com.dwellio.building.repository;

import com.dwellio.domain.entity.Building;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BuildingRepository extends JpaRepository<Building, UUID> {

    @Query("""
            SELECT b FROM Building b
            WHERE b.id = :id AND b.deletedAt IS NULL
            """)
    Optional<Building> findActiveById(@Param("id") UUID id);

    @Query("""
            SELECT b FROM Building b
            WHERE b.organization.id = :organizationId AND b.deletedAt IS NULL
            ORDER BY b.name
            """)
    List<Building> findAllActiveByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT b FROM Building b
            WHERE b.id = :id AND b.organization.id = :organizationId AND b.deletedAt IS NULL
            """)
    Optional<Building> findActiveByIdAndOrganizationId(
            @Param("id") UUID id,
            @Param("organizationId") UUID organizationId
    );
}
