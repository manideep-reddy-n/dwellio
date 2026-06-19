package com.dwellio.membership.service;

import com.dwellio.auth.repository.UserRepository;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ConflictException;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Role;
import com.dwellio.domain.entity.StaffInvitation;
import com.dwellio.domain.entity.User;
import com.dwellio.domain.enums.MembershipStatus;
import com.dwellio.domain.enums.StaffInvitationStatus;
import com.dwellio.membership.dto.MembershipResponse;
import com.dwellio.membership.dto.OrganizationTeamMemberResponse;
import com.dwellio.membership.dto.StaffInviteRequest;
import com.dwellio.membership.dto.StaffInviteResponse;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.membership.repository.StaffInvitationRepository;
import com.dwellio.organization.service.OrganizationService;
import com.dwellio.role.service.RoleService;
import java.time.Clock;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MembershipService {

    private final MembershipRepository membershipRepository;
    private final StaffInvitationRepository staffInvitationRepository;
    private final UserRepository userRepository;
    private final OrganizationService organizationService;
    private final RoleService roleService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<OrganizationTeamMemberResponse> listTeamContacts(UUID organizationId) {
        organizationService.findActiveOrganization(organizationId);
        return membershipRepository.findActiveTeamByOrganizationId(organizationId).stream()
                .map(m -> new OrganizationTeamMemberResponse(
                        m.getUser().getFullName(),
                        m.getRole().getName(),
                        m.getUser().getEmail(),
                        m.getUser().getPhone(),
                        m.getRole().isOwnerRole()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MembershipResponse> listResidents(UUID organizationId) {
        organizationService.findActiveOrganization(organizationId);
        return membershipRepository.findActiveResidentsByOrganizationId(organizationId).stream()
                .map(MembershipService::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MembershipResponse> listMemberships(UUID organizationId) {
        organizationService.findActiveOrganization(organizationId);
        return membershipRepository.findAllActiveByOrganizationId(organizationId).stream()
                .map(MembershipService::toResponse)
                .toList();
    }

    @Transactional
    public StaffInviteResponse inviteStaff(
            UUID organizationId,
            UUID inviterUserId,
            StaffInviteRequest request
    ) {
        Organization organization = organizationService.findActiveOrganization(organizationId);
        Role role = roleService.getAssignableRole(organizationId, request.roleId());
        String email = request.email().trim().toLowerCase();

        return userRepository.findActiveByEmail(email)
                .map(user -> inviteExistingUser(organization, user, role, inviterUserId))
                .orElseGet(() -> recordPendingInvitation(organization, email, role, inviterUserId));
    }

    private StaffInviteResponse inviteExistingUser(
            Organization organization,
            User user,
            Role role,
            UUID inviterUserId
    ) {
        if (membershipRepository.existsActiveByUserIdAndOrganizationId(user.getId(), organization.getId())) {
            throw new ConflictException("User already has an active membership in this organization");
        }

        Membership membership = new Membership();
        membership.setId(UUID.randomUUID());
        membership.setUser(user);
        membership.setOrganization(organization);
        membership.setRole(role);
        membership.setStatus(MembershipStatus.ACTIVE);
        membership.setJoinedAt(clock.instant());
        membershipRepository.save(membership);

        return new StaffInviteResponse(
                "ACTIVE",
                "Staff member added successfully",
                toResponse(membership)
        );
    }

    private StaffInviteResponse recordPendingInvitation(
            Organization organization,
            String email,
            Role role,
            UUID inviterUserId
    ) {
        staffInvitationRepository
                .findByOrganizationIdAndEmailAndStatus(organization.getId(), email, StaffInvitationStatus.PENDING)
                .ifPresent(invitation -> {
                    throw new ConflictException("A pending invitation already exists for this email");
                });

        User inviter = userRepository.findActiveById(inviterUserId)
                .orElseThrow(() -> new BadRequestException("Inviter not found"));

        StaffInvitation invitation = new StaffInvitation();
        invitation.setId(UUID.randomUUID());
        invitation.setOrganization(organization);
        invitation.setEmail(email);
        invitation.setRole(role);
        invitation.setInvitedBy(inviter);
        invitation.setStatus(StaffInvitationStatus.PENDING);
        staffInvitationRepository.save(invitation);

        return new StaffInviteResponse(
                "PENDING_INVITATION",
                "User not found. Pending invitation recorded for future fulfillment.",
                null
        );
    }

    static MembershipResponse toResponse(Membership membership) {
        return new MembershipResponse(
                membership.getId(),
                membership.getUser().getId(),
                membership.getUser().getEmail(),
                membership.getUser().getFullName(),
                membership.getRole().getId(),
                membership.getRole().getName(),
                membership.getUser().getPhone(),
                membership.getStatus(),
                membership.getJoinedAt()
        );
    }
}
