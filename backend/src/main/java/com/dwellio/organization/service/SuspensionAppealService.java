package com.dwellio.organization.service;

import com.dwellio.accommodation.service.AccommodationGuard;
import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.common.security.MembershipContext;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.OrganizationSuspensionAppeal;
import com.dwellio.domain.enums.NotificationType;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.SuspensionAppealStatus;
import com.dwellio.auth.repository.UserRepository;
import com.dwellio.domain.entity.User;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.notification.service.NotificationService;
import com.dwellio.organization.dto.SubmitSuspensionAppealRequest;
import com.dwellio.organization.dto.SuspensionAppealResponse;
import com.dwellio.organization.repository.OrganizationSuspensionAppealRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SuspensionAppealService {

    private final OrganizationSuspensionAppealRepository appealRepository;
    private final AccommodationGuard accommodationGuard;
    private final AuthorizationService authorizationService;
    private final MembershipRepository membershipRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SuspensionAppealResponse> listForOrganization(UUID organizationId) {
        authorizationService.requirePermission(organizationId, "organization:read");
        return appealRepository.findAllByOrganizationId(organizationId).stream()
                .map(SuspensionAppealResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public SuspensionAppealResponse getLatestPending(UUID organizationId) {
        authorizationService.requirePermission(organizationId, "organization:read");
        return appealRepository
                .findFirstByOrganization_IdAndStatusOrderByCreatedAtDesc(
                        organizationId, SuspensionAppealStatus.PENDING)
                .map(SuspensionAppealResponse::from)
                .orElse(null);
    }

    @Transactional
    public SuspensionAppealResponse submit(
            UUID organizationId,
            UserPrincipal principal,
            SubmitSuspensionAppealRequest request
    ) {
        MembershipContext context = authorizationService.requirePermission(organizationId, "organization:update");
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        if (organization.getStatus() != OrganizationStatus.SUSPENDED) {
            throw new BadRequestException("Appeals are only allowed for suspended organizations");
        }

        boolean hasPending = appealRepository
                .findFirstByOrganization_IdAndStatusOrderByCreatedAtDesc(
                        organizationId, SuspensionAppealStatus.PENDING)
                .isPresent();
        if (hasPending) {
            throw new BadRequestException("You already have a pending appeal");
        }

        OrganizationSuspensionAppeal appeal = new OrganizationSuspensionAppeal();
        appeal.setId(UUID.randomUUID());
        appeal.setOrganization(organization);
        appeal.setSubmittedByMembership(referenceMembership(context.getMembershipId()));
        appeal.setReason(request.reason().trim());
        appeal.setStatus(SuspensionAppealStatus.PENDING);

        appeal = appealRepository.save(appeal);

        Map<String, Object> ownerPayload = new HashMap<>();
        ownerPayload.put("organizationId", organization.getId().toString());
        ownerPayload.put("organizationSlug", organization.getSlug());
        ownerPayload.put("appealId", appeal.getId().toString());
        ownerPayload.put("targetPath", "/app/" + organization.getSlug() + "/operations");

        for (Membership owner : membershipRepository.findActiveOwnersByOrganizationId(organizationId)) {
            notificationService.create(
                    owner.getUser().getId(),
                    organizationId,
                    NotificationType.SUSPENSION_APPEAL_SUBMITTED,
                    "Appeal submitted",
                    "Your suspension appeal for %s has been submitted for admin review."
                            .formatted(organization.getName()),
                    ownerPayload
            );
        }

        Map<String, Object> adminPayload = new HashMap<>();
        adminPayload.put("organizationId", organization.getId().toString());
        adminPayload.put("organizationSlug", organization.getSlug());
        adminPayload.put("appealId", appeal.getId().toString());
        adminPayload.put(
                "targetPath",
                "/admin/organizations/" + organization.getId());

        for (User admin : userRepository.findActivePlatformAdmins()) {
            notificationService.create(
                    admin.getId(),
                    organizationId,
                    NotificationType.SUSPENSION_APPEAL_SUBMITTED,
                    "Suspension appeal received",
                    "%s submitted a suspension appeal for review.".formatted(organization.getName()),
                    adminPayload
            );
        }

        return SuspensionAppealResponse.from(appeal);
    }

    private static Membership referenceMembership(UUID membershipId) {
        Membership membership = new Membership();
        membership.setId(membershipId);
        return membership;
    }
}
