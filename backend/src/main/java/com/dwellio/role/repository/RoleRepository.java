package com.dwellio.role.repository;

import com.dwellio.domain.entity.Role;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoleRepository extends JpaRepository<Role, UUID> {

    @Query("""
            SELECT r FROM Role r
            WHERE r.id = :id AND r.organization.id = :organizationId AND r.deletedAt IS NULL
            """)
    Optional<Role> findActiveByIdAndOrganizationId(
            @Param("id") UUID id,
            @Param("organizationId") UUID organizationId
    );

    @Query("""
            SELECT r FROM Role r
            WHERE r.organization.id = :organizationId AND r.name = :name AND r.deletedAt IS NULL
            """)
    Optional<Role> findActiveByOrganizationIdAndName(
            @Param("organizationId") UUID organizationId,
            @Param("name") String name
    );

    @Query("""
            SELECT r FROM Role r
            WHERE r.organization.id = :organizationId AND r.deletedAt IS NULL
            ORDER BY r.system DESC, r.name ASC
            """)
    List<Role> findAllActiveByOrganizationId(@Param("organizationId") UUID organizationId);
}
