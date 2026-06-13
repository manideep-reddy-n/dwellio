package com.dwellio.role.service;

import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ConflictException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.RoleConstants;
import com.dwellio.domain.entity.Permission;
import com.dwellio.domain.entity.Role;
import com.dwellio.domain.entity.RolePermission;
import com.dwellio.organization.service.OrganizationService;
import com.dwellio.role.dto.CreateRoleRequest;
import com.dwellio.role.dto.RoleResponse;
import com.dwellio.role.dto.UpdateRoleRequest;
import com.dwellio.role.repository.PermissionRepository;
import com.dwellio.role.repository.RolePermissionRepository;
import com.dwellio.role.repository.RoleRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final OrganizationService organizationService;

    @Transactional(readOnly = true)
    public List<RoleResponse> listRoles(UUID organizationId) {
        organizationService.findActiveOrganization(organizationId);
        return roleRepository.findAllActiveByOrganizationId(organizationId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RoleResponse createRole(UUID organizationId, CreateRoleRequest request) {
        organizationService.findActiveOrganization(organizationId);
        validateCustomRoleName(request.name());

        if (roleRepository.findActiveByOrganizationIdAndName(organizationId, request.name()).isPresent()) {
            throw new ConflictException("Role name already exists");
        }

        Role role = new Role();
        role.setId(UUID.randomUUID());
        role.setOrganization(organizationService.findActiveOrganization(organizationId));
        role.setName(request.name().trim());
        role.setSystem(false);
        role.setOwnerRole(false);
        roleRepository.save(role);

        replacePermissions(role.getId(), request.permissions());
        return toResponse(roleRepository.findById(role.getId()).orElseThrow());
    }

    @Transactional
    public RoleResponse updateRole(UUID organizationId, UUID roleId, UpdateRoleRequest request) {
        Role role = getCustomRole(organizationId, roleId);

        if (request.name() != null) {
            validateCustomRoleName(request.name());
            if (!role.getName().equalsIgnoreCase(request.name())
                    && roleRepository.findActiveByOrganizationIdAndName(organizationId, request.name()).isPresent()) {
                throw new ConflictException("Role name already exists");
            }
            role.setName(request.name().trim());
        }

        if (request.permissions() != null) {
            replacePermissions(role.getId(), request.permissions());
        }

        return toResponse(role);
    }

    @Transactional
    public void deleteRole(UUID organizationId, UUID roleId) {
        Role role = getCustomRole(organizationId, roleId);
        role.setDeletedAt(java.time.Instant.now());
        roleRepository.save(role);
    }

    public Role getAssignableRole(UUID organizationId, UUID roleId) {
        Role role = roleRepository.findActiveByIdAndOrganizationId(roleId, organizationId)
                .orElseThrow(() -> new NotFoundException("Role not found"));
        if (role.isSystem()) {
            throw new BadRequestException("System roles cannot be assigned to staff");
        }
        return role;
    }

    public Role getResidentRole(UUID organizationId) {
        return roleRepository.findActiveByOrganizationIdAndName(organizationId, RoleConstants.RESIDENT)
                .orElseThrow(() -> new NotFoundException("Resident role not found"));
    }

    private Role getCustomRole(UUID organizationId, UUID roleId) {
        Role role = roleRepository.findActiveByIdAndOrganizationId(roleId, organizationId)
                .orElseThrow(() -> new NotFoundException("Role not found"));
        if (role.isSystem()) {
            throw new BadRequestException("System roles cannot be modified");
        }
        return role;
    }

    private void replacePermissions(UUID roleId, List<String> permissionCodes) {
        List<Permission> permissions = permissionRepository.findByCodeIn(permissionCodes);
        if (permissions.size() != permissionCodes.stream().distinct().count()) {
            throw new BadRequestException("One or more permissions are invalid");
        }

        rolePermissionRepository.deleteAllByRoleId(roleId);
        for (Permission permission : permissions) {
            RolePermission rolePermission = new RolePermission();
            rolePermission.setRoleId(roleId);
            rolePermission.setPermissionId(permission.getId());
            rolePermissionRepository.save(rolePermission);
        }
    }

    private void validateCustomRoleName(String name) {
        if (RoleConstants.OWNER.equalsIgnoreCase(name) || RoleConstants.RESIDENT.equalsIgnoreCase(name)) {
            throw new BadRequestException("Reserved role name");
        }
    }

    private RoleResponse toResponse(Role role) {
        List<String> permissions = role.isOwnerRole()
                ? List.of("*")
                : permissionRepository.findPermissionCodesByRoleId(role.getId());
        return new RoleResponse(
                role.getId(),
                role.getName(),
                role.isSystem(),
                role.isOwnerRole(),
                permissions
        );
    }
}
