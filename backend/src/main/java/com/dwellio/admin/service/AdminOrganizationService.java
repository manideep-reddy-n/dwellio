package com.dwellio.admin.service;

import com.dwellio.admin.dto.AdminOrganizationSummary;
import com.dwellio.admin.dto.RejectOrganizationRequest;
import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ForbiddenException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.OrganizationMetricsCache;
import com.dwellio.domain.entity.User;
import com.dwellio.domain.enums.NotificationType;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.SuspensionAppealStatus;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.notification.service.NotificationService;
import com.dwellio.organization.dto.SuspensionAppealResponse;
import com.dwellio.organization.repository.OrganizationMetricsCacheRepository;
import com.dwellio.organization.repository.OrganizationRepository;
import com.dwellio.organization.repository.OrganizationSuspensionAppealRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminOrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMetricsCacheRepository metricsCacheRepository;
    private final MembershipRepository membershipRepository;
    private final AuthorizationService authorizationService;
    private final NotificationService notificationService;
    private final OrganizationSuspensionAppealRepository appealRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<AdminOrganizationSummary> listAll(OrganizationStatus statusFilter) {
        requirePlatformAdmin();
        return organizationRepository.findAllActive().stream()
                .filter(o -> statusFilter == null || o.getStatus() == statusFilter)
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminOrganizationSummary getById(UUID organizationId) {
        requirePlatformAdmin();
        return toSummary(findOrg(organizationId));
    }

    @Transactional
    public AdminOrganizationSummary verify(UUID organizationId, UserPrincipal principal) {
        requirePlatformAdmin();
        Organization organization = findOrg(organizationId);
        if (organization.getStatus() == OrganizationStatus.VERIFIED) {
            throw new BadRequestException("Organization is already verified");
        }
        organization.setStatus(OrganizationStatus.VERIFIED);
        organization.setVerifiedAt(Instant.now(clock));
        organization.setVerifiedBy(referenceUser(principal.getId()));
        organization.setRejectionReason(null);

        notifyOwners(organization, "Organization verified",
                "Congratulations! %s is now verified on Dwellio.".formatted(organization.getName()));

        return toSummary(organization);
    }

    @Transactional
    public AdminOrganizationSummary reject(UUID organizationId, UserPrincipal principal, RejectOrganizationRequest request) {
        requirePlatformAdmin();
        Organization organization = findOrg(organizationId);
        organization.setStatus(OrganizationStatus.REJECTED);
        organization.setRejectionReason(request.reason());
        organization.setVerifiedBy(referenceUser(principal.getId()));
        organization.setVerifiedAt(Instant.now(clock));

        notifyOwners(organization, "Verification declined",
                "Verification for %s was declined. Reason: %s"
                        .formatted(organization.getName(), request.reason() != null ? request.reason() : "Not specified"));

        return toSummary(organization);
    }

    @Transactional
    public AdminOrganizationSummary suspend(UUID organizationId) {
        requirePlatformAdmin();
        Organization organization = findOrg(organizationId);
        if (organization.getStatus() == OrganizationStatus.SUSPENDED) {
            throw new BadRequestException("Organization is already suspended");
        }
        organization.setStatus(OrganizationStatus.SUSPENDED);
        notifyOwners(
                organization,
                NotificationType.ORGANIZATION_SUSPENDED,
                "Organization suspended",
                "%s has been suspended and is hidden from the public marketplace. Submit an appeal from your dashboard."
                        .formatted(organization.getName())
        );
        return toSummary(organization);
    }

    @Transactional
    public AdminOrganizationSummary unsuspend(UUID organizationId) {
        requirePlatformAdmin();
        Organization organization = findOrg(organizationId);
        if (organization.getStatus() != OrganizationStatus.SUSPENDED) {
            throw new BadRequestException("Organization is not suspended");
        }
        organization.setStatus(
                organization.getVerifiedAt() != null
                        ? OrganizationStatus.VERIFIED
                        : OrganizationStatus.DRAFT
        );
        notifyOwners(
                organization,
                NotificationType.ORGANIZATION_VERIFIED,
                "Suspension lifted",
                "The suspension on %s has been lifted. Your organization visibility has been restored."
                        .formatted(organization.getName())
        );
        return toSummary(organization);
    }

    @Transactional(readOnly = true)
    public List<SuspensionAppealResponse> listAppeals(UUID organizationId) {
        requirePlatformAdmin();
        findOrg(organizationId);
        return appealRepository.findAllByOrganizationId(organizationId).stream()
                .map(SuspensionAppealResponse::from)
                .toList();
    }

    @Transactional
    public SuspensionAppealResponse reviewAppeal(
            UUID organizationId,
            UUID appealId,
            UserPrincipal principal,
            String adminNotes
    ) {
        requirePlatformAdmin();
        var appeal = appealRepository.findById(appealId)
                .filter(a -> a.getOrganization().getId().equals(organizationId))
                .orElseThrow(() -> new NotFoundException("Appeal not found"));
        appeal.setStatus(SuspensionAppealStatus.REVIEWED);
        appeal.setAdminNotes(adminNotes);
        appeal.setReviewedAt(Instant.now(clock));
        appeal.setReviewedBy(referenceUser(principal.getId()));
        return SuspensionAppealResponse.from(appealRepository.save(appeal));
    }

    private void notifyOwners(
            Organization organization,
            NotificationType type,
            String title,
            String body
    ) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("organizationId", organization.getId().toString());
        payload.put("organizationSlug", organization.getSlug());
        if (type == NotificationType.ORGANIZATION_SUSPENDED) {
            payload.put("targetPath", "/app/" + organization.getSlug() + "/operations");
        } else if (type == NotificationType.ORGANIZATION_VERIFIED) {
            payload.put("targetPath", "/app/" + organization.getSlug() + "/operations/settings");
        }
        for (var owner : membershipRepository.findActiveOwnersByOrganizationId(organization.getId())) {
            notificationService.create(
                    owner.getUser().getId(),
                    organization.getId(),
                    type,
                    title,
                    body,
                    payload
            );
        }
    }

    private void notifyOwners(Organization organization, String title, String body) {
        notifyOwners(organization, NotificationType.ORGANIZATION_VERIFIED, title, body);
    }

    private Organization findOrg(UUID organizationId) {
        return organizationRepository.findActiveById(organizationId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));
    }

    private void requirePlatformAdmin() {
        if (!authorizationService.isPlatformAdmin()) {
            throw new ForbiddenException("Platform admin access required");
        }
    }

    private AdminOrganizationSummary toSummary(Organization organization) {
        int residents = metricsCacheRepository.findById(organization.getId())
                .map(OrganizationMetricsCache::getActiveResidentCount)
                .orElse(0);
        return new AdminOrganizationSummary(
                organization.getId(),
                organization.getSlug(),
                organization.getName(),
                organization.getType(),
                organization.getHostelAudience(),
                organization.getAccommodationMode(),
                organization.getStatus(),
                organization.getCity(),
                organization.getArea(),
                organization.getContactPhone(),
                organization.getContactEmail(),
                organization.getDefaultMonthlyRent(),
                organization.getLogoUrl(),
                residents,
                organization.getCreatedAt(),
                organization.getVerifiedAt(),
                organization.getRejectionReason()
        );
    }

    private static User referenceUser(UUID userId) {
        User user = new User();
        user.setId(userId);
        return user;
    }
}
