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
}
