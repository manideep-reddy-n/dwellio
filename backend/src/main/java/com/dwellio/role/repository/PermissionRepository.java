package com.dwellio.role.repository;

import com.dwellio.domain.entity.Permission;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PermissionRepository extends JpaRepository<Permission, java.util.UUID> {

    Optional<Permission> findByCode(String code);

    List<Permission> findByCodeIn(Collection<String> codes);

    @Query("""
            SELECT p.code FROM Permission p
            JOIN RolePermission rp ON rp.permissionId = p.id
            WHERE rp.roleId = :roleId
            """)
    List<String> findPermissionCodesByRoleId(@Param("roleId") java.util.UUID roleId);
}
