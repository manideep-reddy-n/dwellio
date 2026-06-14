package com.dwellio.membership.service;

import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.enums.MembershipStatus;
import com.dwellio.membership.dto.UserMembershipResponse;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.role.repository.PermissionRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MeMembershipService {

    private final MembershipRepository membershipRepository;
    private final PermissionRepository permissionRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<UserMembershipResponse> listMyMemberships(UUID userId) {
        return membershipRepository.findAllActiveByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserMembershipResponse getMyMembership(UserPrincipal principal, String organizationSlug) {
        return listMyMemberships(principal.getId()).stream()
                .filter(m -> m.organizationSlug().equalsIgnoreCase(organizationSlug))
                .findFirst()
                .orElseThrow(() -> new com.dwellio.common.exception.ForbiddenException("Active membership required"));
    }

    @Transactional
    public void leaveOrganization(UUID userId, UUID organizationId) {
        throw new BadRequestException(
                "Direct leave is disabled. Submit a leave request for owner approval."
        );
    }

    private UserMembershipResponse toResponse(Membership membership) {
        boolean owner = membership.getRole().isOwnerRole();
        Set<String> permissions = owner
                ? Set.of()
                : new HashSet<>(permissionRepository.findPermissionCodesByRoleId(membership.getRole().getId()));

        return new UserMembershipResponse(
                membership.getId(),
                membership.getOrganization().getId(),
                membership.getOrganization().getSlug(),
                membership.getOrganization().getName(),
                membership.getOrganization().getType(),
                membership.getOrganization().getLogoUrl(),
                membership.getOrganization().getAccommodationMode(),
                membership.getRole().getName(),
                owner,
                List.copyOf(permissions)
        );
    }
}
