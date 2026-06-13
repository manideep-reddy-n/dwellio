package com.dwellio.role.controller;

import com.dwellio.role.dto.CreateRoleRequest;
import com.dwellio.role.dto.RoleResponse;
import com.dwellio.role.dto.UpdateRoleRequest;
import com.dwellio.role.service.RoleService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    @PreAuthorize("@authz.hasPermission(#organizationId, 'role:manage')")
    public List<RoleResponse> listRoles(@PathVariable UUID organizationId) {
        return roleService.listRoles(organizationId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'role:manage')")
    public RoleResponse createRole(
            @PathVariable UUID organizationId,
            @Valid @RequestBody CreateRoleRequest request
    ) {
        return roleService.createRole(organizationId, request);
    }

    @PutMapping("/{roleId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'role:manage')")
    public RoleResponse updateRole(
            @PathVariable UUID organizationId,
            @PathVariable UUID roleId,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        return roleService.updateRole(organizationId, roleId, request);
    }

    @DeleteMapping("/{roleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'role:manage')")
    public void deleteRole(@PathVariable UUID organizationId, @PathVariable UUID roleId) {
        roleService.deleteRole(organizationId, roleId);
    }
}
