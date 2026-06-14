package com.dwellio.common.security;

import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.common.exception.ForbiddenException;
import com.dwellio.domain.entity.Membership;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.role.repository.PermissionRepository;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service("authz")
@RequiredArgsConstructor
public class AuthorizationService {

    private final MembershipRepository membershipRepository;
    private final PermissionRepository permissionRepository;
    private final TenantContext tenantContext;

    public boolean isPlatformAdmin() {
        return currentPrincipal().isPlatformAdmin();
    }

    @Transactional(readOnly = true)
    public boolean hasPermission(UUID organizationId, String permission) {
        tenantContext.requireOrganization(organizationId);
        return loadMembershipContext(organizationId).hasPermission(permission);
    }

    @Transactional(readOnly = true)
    public boolean canViewAccommodationVisualization(UUID organizationId) {
        tenantContext.requireOrganization(organizationId);
        MembershipContext context = loadMembershipContext(organizationId);
        return context.isOwner()
                || context.hasPermission("building:manage")
                || context.hasPermission("allocation:read_own");
    }

    @Transactional(readOnly = true)
    public boolean hasPermissionBySlug(String slug, String permission) {
        UUID organizationId = tenantContext.resolveOrganizationIdBySlug(slug);
        return hasPermission(organizationId, permission);
    }

    @Transactional(readOnly = true)
    public MembershipContext requireMembership(UUID organizationId) {
        tenantContext.requireOrganization(organizationId);
        return loadMembershipContext(organizationId);
    }

    @Transactional(readOnly = true)
    public MembershipContext requirePermission(UUID organizationId, String permission) {
        MembershipContext context = requireMembership(organizationId);
        if (!context.hasPermission(permission)) {
            throw new ForbiddenException("Insufficient permissions");
        }
        return context;
    }

    public UserPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ForbiddenException("Authentication required");
        }
        return principal;
    }

    private MembershipContext loadMembershipContext(UUID organizationId) {
        UserPrincipal principal = currentPrincipal();
        Membership membership = membershipRepository
                .findActiveByUserIdAndOrganizationId(principal.getId(), organizationId)
                .orElseThrow(() -> new ForbiddenException("Active membership required"));

        boolean owner = membership.getRole().isOwnerRole();
        Set<String> permissions = owner
                ? Set.of()
                : new HashSet<>(permissionRepository.findPermissionCodesByRoleId(membership.getRole().getId()));

        return new MembershipContext(membership, owner, permissions);
    }
}
