package com.dwellio.ownership.repository;

import com.dwellio.domain.entity.UnitOwnershipRecord;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UnitOwnershipRecordRepository extends JpaRepository<UnitOwnershipRecord, UUID> {

    @Query("""
            SELECT r FROM UnitOwnershipRecord r
            JOIN FETCH r.unitSpace s
            WHERE r.organization.id = :organizationId
            ORDER BY s.identifier, r.effectiveFrom DESC
            """)
    List<UnitOwnershipRecord> findAllByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT r FROM UnitOwnershipRecord r
            JOIN FETCH r.unitSpace s
            WHERE r.organization.id = :organizationId
              AND r.unitSpace.id = :unitSpaceId
            ORDER BY r.effectiveFrom DESC
            """)
    List<UnitOwnershipRecord> findByOrganizationAndUnit(
            @Param("organizationId") UUID organizationId,
            @Param("unitSpaceId") UUID unitSpaceId
    );
}
