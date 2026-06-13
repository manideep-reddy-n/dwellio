package com.dwellio.bed.repository;

import com.dwellio.domain.entity.Bed;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BedRepository extends JpaRepository<Bed, UUID> {

    @Query("""
            SELECT b FROM Bed b
            JOIN FETCH b.space s
            WHERE b.id = :id AND b.deletedAt IS NULL
            """)
    Optional<Bed> findActiveById(@Param("id") UUID id);

    @Query("""
            SELECT b FROM Bed b
            JOIN FETCH b.space s
            WHERE b.id = :id AND b.organization.id = :organizationId AND b.deletedAt IS NULL
            """)
    Optional<Bed> findActiveByIdAndOrganizationId(
            @Param("id") UUID id,
            @Param("organizationId") UUID organizationId
    );

    @Query("""
            SELECT b FROM Bed b
            WHERE b.space.id = :spaceId AND b.deletedAt IS NULL
            ORDER BY b.bedLabel
            """)
    List<Bed> findAllActiveBySpaceId(@Param("spaceId") UUID spaceId);

    @Query("""
            SELECT COUNT(b) FROM Bed b
            WHERE b.space.id = :spaceId AND b.deletedAt IS NULL
            """)
    int countActiveBySpaceId(@Param("spaceId") UUID spaceId);

    @Query("""
            SELECT COUNT(b) > 0 FROM Bed b
            WHERE b.space.id = :spaceId AND b.bedLabel = :bedLabel AND b.deletedAt IS NULL
            """)
    boolean existsActiveBySpaceIdAndBedLabel(
            @Param("spaceId") UUID spaceId,
            @Param("bedLabel") String bedLabel
    );
}
