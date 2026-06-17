package com.dwellio.membership.repository;

import com.dwellio.domain.entity.Membership;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MembershipRepository extends JpaRepository<Membership, UUID> {

    @Query("""
            SELECT m FROM Membership m
            JOIN FETCH m.role r
            JOIN FETCH m.organization o
            WHERE m.user.id = :userId
              AND m.status = 'ACTIVE'
              AND m.deletedAt IS NULL
            ORDER BY m.joinedAt DESC
            """)
    List<Membership> findAllActiveByUserId(@Param("userId") UUID userId);

    @Query("""
            SELECT m FROM Membership m
            JOIN FETCH m.role r
            JOIN FETCH m.user u
            WHERE m.user.id = :userId
              AND m.organization.id = :organizationId
              AND m.status = 'ACTIVE'
              AND m.deletedAt IS NULL
            """)
    Optional<Membership> findActiveByUserIdAndOrganizationId(
            @Param("userId") UUID userId,
            @Param("organizationId") UUID organizationId
    );

    @Query("""
            SELECT m FROM Membership m
            JOIN FETCH m.role r
            JOIN FETCH m.organization o
            WHERE m.user.id = :userId
              AND o.slug = :slug
              AND m.status = 'ACTIVE'
              AND m.deletedAt IS NULL
            """)
    Optional<Membership> findActiveByUserIdAndOrganizationSlug(
            @Param("userId") UUID userId,
            @Param("slug") String slug
    );

    @Query("""
            SELECT COUNT(m) > 0 FROM Membership m
            WHERE m.user.id = :userId
              AND m.organization.id = :organizationId
              AND m.status = 'ACTIVE'
              AND m.deletedAt IS NULL
            """)
    boolean existsActiveByUserIdAndOrganizationId(
            @Param("userId") UUID userId,
            @Param("organizationId") UUID organizationId
    );

    @Query("""
            SELECT m FROM Membership m
            JOIN FETCH m.role r
            JOIN FETCH m.user u
            WHERE m.organization.id = :organizationId
              AND m.status = 'ACTIVE'
              AND m.deletedAt IS NULL
            ORDER BY m.createdAt DESC
            """)
    List<Membership> findAllActiveByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT m FROM Membership m
            JOIN FETCH m.role r
            JOIN FETCH m.user u
            WHERE m.id = :membershipId
              AND m.organization.id = :organizationId
              AND m.status = 'ACTIVE'
              AND m.deletedAt IS NULL
            """)
    Optional<Membership> findActiveByIdAndOrganizationId(
            @Param("membershipId") UUID membershipId,
            @Param("organizationId") UUID organizationId
    );

    @Query("""
            SELECT m FROM Membership m
            JOIN FETCH m.role r
            JOIN FETCH m.user u
            WHERE m.id = :membershipId
              AND m.organization.id = :organizationId
              AND m.deletedAt IS NULL
            """)
    Optional<Membership> findByIdAndOrganizationId(
            @Param("membershipId") UUID membershipId,
            @Param("organizationId") UUID organizationId
    );

    @Query("""
            SELECT m FROM Membership m
            JOIN FETCH m.user u
            JOIN FETCH m.role r
            WHERE m.organization.id = :organizationId
              AND m.status = 'ACTIVE'
              AND m.deletedAt IS NULL
              AND r.name = 'RESIDENT'
            """)
    List<Membership> findActiveResidentsByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT m FROM Membership m
            JOIN FETCH m.user u
            JOIN FETCH m.role r
            WHERE m.organization.id = :organizationId
              AND m.status = 'ACTIVE'
              AND m.deletedAt IS NULL
              AND r.ownerRole = TRUE
            """)
    List<Membership> findActiveOwnersByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT m FROM Membership m
            JOIN FETCH m.user u
            JOIN FETCH m.role r
            WHERE m.organization.id = :organizationId
              AND m.status = 'ACTIVE'
              AND m.deletedAt IS NULL
              AND (r.ownerRole = TRUE OR r.name <> 'RESIDENT')
            ORDER BY r.ownerRole DESC, r.name ASC
            """)
    List<Membership> findActiveTeamByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT DISTINCT m FROM Membership m
            JOIN FETCH m.user u
            JOIN FETCH m.role r
            WHERE m.organization.id = :organizationId
              AND m.status = 'ACTIVE'
              AND m.deletedAt IS NULL
              AND (
                r.ownerRole = TRUE
                OR EXISTS (
                    SELECT 1 FROM RolePermission rp
                    JOIN rp.permission p
                    WHERE rp.roleId = r.id
                      AND p.code = 'resident:approve'
                )
              )
            """)
    List<Membership> findActiveJoinApproversByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT DISTINCT m FROM Membership m
            JOIN FETCH m.user u
            JOIN FETCH m.role r
            WHERE m.organization.id = :organizationId
              AND m.status = 'ACTIVE'
              AND m.deletedAt IS NULL
              AND (
                r.ownerRole = TRUE
                OR EXISTS (
                    SELECT 1 FROM RolePermission rp
                    WHERE rp.roleId = r.id
                      AND rp.permission.code IN ('complaint:read', 'complaint:manage', 'complaint:assign')
                )
              )
            """)
    List<Membership> findActiveComplaintStaffByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT m FROM Membership m
            JOIN FETCH m.user u
            JOIN FETCH m.role r
            WHERE m.organization.id = :organizationId
              AND m.deletedAt IS NULL
            ORDER BY m.createdAt DESC
            """)
    List<Membership> findAllByOrganizationId(@Param("organizationId") UUID organizationId);
}
