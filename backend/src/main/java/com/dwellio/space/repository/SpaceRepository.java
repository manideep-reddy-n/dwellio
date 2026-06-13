package com.dwellio.space.repository;

import com.dwellio.domain.entity.Space;
import com.dwellio.domain.enums.SpaceType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpaceRepository extends JpaRepository<Space, UUID> {

    @Query("""
            SELECT s FROM Space s
            WHERE s.id = :id AND s.deletedAt IS NULL
            """)
    Optional<Space> findActiveById(@Param("id") UUID id);

    @Query("""
            SELECT s FROM Space s
            WHERE s.id = :id AND s.organization.id = :organizationId AND s.deletedAt IS NULL
            """)
    Optional<Space> findActiveByIdAndOrganizationId(
            @Param("id") UUID id,
            @Param("organizationId") UUID organizationId
    );

    @Query("""
            SELECT s FROM Space s
            WHERE s.floor.id = :floorId AND s.deletedAt IS NULL
            ORDER BY s.identifier
            """)
    List<Space> findAllActiveByFloorId(@Param("floorId") UUID floorId);

    @Query("""
            SELECT COUNT(s) > 0 FROM Space s
            WHERE s.floor.id = :floorId AND s.spaceType = :spaceType AND s.identifier = :identifier
              AND s.deletedAt IS NULL
            """)
    boolean existsActiveByFloorIdAndSpaceTypeAndIdentifier(
            @Param("floorId") UUID floorId,
            @Param("spaceType") SpaceType spaceType,
            @Param("identifier") String identifier
    );

    @Query("""
            SELECT s FROM Space s
            WHERE s.organization.id = :organizationId AND s.deletedAt IS NULL
            ORDER BY s.identifier
            """)
    List<Space> findAllActiveByOrganizationId(@Param("organizationId") UUID organizationId);
}
