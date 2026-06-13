package com.dwellio.occupancy.repository;

import com.dwellio.domain.entity.Occupancy;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OccupancyRepository extends JpaRepository<Occupancy, UUID> {

    @Query("""
            SELECT o FROM Occupancy o
            JOIN FETCH o.membership m
            JOIN FETCH m.user u
            LEFT JOIN FETCH o.bed b
            LEFT JOIN FETCH o.unitSpace s
            WHERE o.id = :id AND o.organization.id = :organizationId
            """)
    Optional<Occupancy> findByIdAndOrganizationId(
            @Param("id") UUID id,
            @Param("organizationId") UUID organizationId
    );

    @Query("""
            SELECT o FROM Occupancy o
            JOIN FETCH o.membership m
            JOIN FETCH m.user u
            LEFT JOIN FETCH o.bed b
            LEFT JOIN FETCH o.unitSpace s
            WHERE o.membership.id = :membershipId AND o.current = true
            """)
    Optional<Occupancy> findCurrentByMembershipId(@Param("membershipId") UUID membershipId);

    @Query("""
            SELECT COUNT(o) > 0 FROM Occupancy o
            WHERE o.membership.id = :membershipId AND o.current = true
            """)
    boolean existsCurrentByMembershipId(@Param("membershipId") UUID membershipId);

    @Query("""
            SELECT COUNT(o) > 0 FROM Occupancy o
            WHERE o.bed.id = :bedId AND o.current = true
            """)
    boolean existsCurrentByBedId(@Param("bedId") UUID bedId);

    @Query("""
            SELECT COUNT(o) > 0 FROM Occupancy o
            WHERE o.unitSpace.id = :unitSpaceId AND o.current = true
            """)
    boolean existsCurrentByUnitSpaceId(@Param("unitSpaceId") UUID unitSpaceId);

    @Query("""
            SELECT o FROM Occupancy o
            JOIN FETCH o.membership m
            JOIN FETCH m.user u
            WHERE o.organization.id = :organizationId
            ORDER BY o.createdAt DESC
            """)
    List<Occupancy> findAllByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT o FROM Occupancy o
            JOIN FETCH o.membership m
            JOIN FETCH m.user u
            WHERE o.organization.id = :organizationId AND o.membership.id = :membershipId
            ORDER BY o.createdAt DESC
            """)
    List<Occupancy> findAllByOrganizationIdAndMembershipId(
            @Param("organizationId") UUID organizationId,
            @Param("membershipId") UUID membershipId
    );
}
