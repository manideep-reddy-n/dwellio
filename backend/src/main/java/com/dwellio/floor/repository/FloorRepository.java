package com.dwellio.floor.repository;

import com.dwellio.domain.entity.Floor;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FloorRepository extends JpaRepository<Floor, UUID> {

    @Query("""
            SELECT f FROM Floor f
            WHERE f.id = :id AND f.deletedAt IS NULL
            """)
    Optional<Floor> findActiveById(@Param("id") UUID id);

    @Query("""
            SELECT f FROM Floor f
            WHERE f.id = :id AND f.organization.id = :organizationId AND f.deletedAt IS NULL
            """)
    Optional<Floor> findActiveByIdAndOrganizationId(
            @Param("id") UUID id,
            @Param("organizationId") UUID organizationId
    );

    @Query("""
            SELECT f FROM Floor f
            WHERE f.building.id = :buildingId AND f.deletedAt IS NULL
            ORDER BY f.floorNumber
            """)
    List<Floor> findAllActiveByBuildingId(@Param("buildingId") UUID buildingId);

    @Query("""
            SELECT COUNT(f) > 0 FROM Floor f
            WHERE f.building.id = :buildingId AND f.floorNumber = :floorNumber AND f.deletedAt IS NULL
            """)
    boolean existsActiveByBuildingIdAndFloorNumber(
            @Param("buildingId") UUID buildingId,
            @Param("floorNumber") int floorNumber
    );
}
