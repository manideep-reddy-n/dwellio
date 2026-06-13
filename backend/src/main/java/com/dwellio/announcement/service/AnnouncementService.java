package com.dwellio.announcement.service;

import com.dwellio.announcement.dto.AnnouncementResponse;
import com.dwellio.announcement.dto.CreateAnnouncementRequest;
import com.dwellio.announcement.dto.UpdateAnnouncementRequest;
import com.dwellio.announcement.repository.AnnouncementRepository;
import com.dwellio.auth.repository.UserRepository;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ForbiddenException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.common.security.MembershipContext;
import com.dwellio.domain.entity.Announcement;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.User;
import com.dwellio.operations.service.OperationsGuard;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import com.dwellio.common.event.AfterCommitEventPublisher;
import com.dwellio.notification.event.AnnouncementPublishedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final OperationsGuard operationsGuard;
    private final AuthorizationService authorizationService;
    private final Clock clock;
    private final AfterCommitEventPublisher afterCommitEventPublisher;

    @Transactional
    public AnnouncementResponse create(UUID organizationId, CreateAnnouncementRequest request) {
        authorizationService.requirePermission(organizationId, "announcement:manage");
        Organization organization = operationsGuard.requireOrganization(organizationId);
        User creator = userRepository.findActiveById(authorizationService.currentPrincipal().getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        Announcement announcement = new Announcement();
        announcement.setId(UUID.randomUUID());
        announcement.setOrganization(organization);
        announcement.setCreatedBy(creator);
        announcement.setTitle(request.title().trim());
        announcement.setContent(request.content().trim());
        announcement.setType(request.type());
        return AnnouncementResponse.from(announcementRepository.save(announcement));
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> list(UUID organizationId) {
        operationsGuard.requireOrganization(organizationId);
        MembershipContext context = authorizationService.requireMembership(organizationId);

        if (context.isOwner() || context.hasPermission("announcement:manage")
                || context.hasPermission("announcement:read")) {
            return announcementRepository.findAllActiveByOrganizationId(organizationId).stream()
                    .map(AnnouncementResponse::from)
                    .toList();
        }

        if (context.hasPermission("announcement:read_own")) {
            return announcementRepository.findAllPublishedByOrganizationId(organizationId).stream()
                    .map(AnnouncementResponse::from)
                    .toList();
        }

        throw new ForbiddenException("Insufficient permissions");
    }

    @Transactional(readOnly = true)
    public AnnouncementResponse get(UUID organizationId, UUID announcementId) {
        Announcement announcement = getActiveAnnouncement(organizationId, announcementId);
        requireReadAccess(announcement);
        return AnnouncementResponse.from(announcement);
    }

    @Transactional
    public AnnouncementResponse update(
            UUID organizationId,
            UUID announcementId,
            UpdateAnnouncementRequest request
    ) {
        authorizationService.requirePermission(organizationId, "announcement:manage");
        Announcement announcement = getActiveAnnouncement(organizationId, announcementId);

        if (request.title() != null) {
            announcement.setTitle(request.title().trim());
        }
        if (request.content() != null) {
            announcement.setContent(request.content().trim());
        }
        if (request.type() != null) {
            announcement.setType(request.type());
        }

        return AnnouncementResponse.from(announcement);
    }

    @Transactional
    public AnnouncementResponse publish(UUID organizationId, UUID announcementId) {
        authorizationService.requirePermission(organizationId, "announcement:manage");
        Announcement announcement = getActiveAnnouncement(organizationId, announcementId);

        if (announcement.getPublishedAt() != null) {
            throw new BadRequestException("Announcement is already published");
        }

        announcement.setPublishedAt(Instant.now(clock));
        AnnouncementResponse response = AnnouncementResponse.from(announcement);
        afterCommitEventPublisher.publish(new AnnouncementPublishedEvent(
                organizationId,
                announcement.getId(),
                announcement.getTitle()
        ));
        return response;
    }

    @Transactional
    public void delete(UUID organizationId, UUID announcementId) {
        authorizationService.requirePermission(organizationId, "announcement:manage");
        Announcement announcement = getActiveAnnouncement(organizationId, announcementId);
        announcement.setDeletedAt(Instant.now(clock));
    }

    private Announcement getActiveAnnouncement(UUID organizationId, UUID announcementId) {
        operationsGuard.requireOrganization(organizationId);
        return announcementRepository.findActiveByIdAndOrganizationId(announcementId, organizationId)
                .orElseThrow(() -> new NotFoundException("Announcement not found"));
    }

    private void requireReadAccess(Announcement announcement) {
        MembershipContext context = authorizationService.requireMembership(announcement.getOrganization().getId());

        if (context.isOwner() || context.hasPermission("announcement:manage")
                || context.hasPermission("announcement:read")) {
            return;
        }

        if (context.hasPermission("announcement:read_own") && announcement.getPublishedAt() != null) {
            return;
        }

        throw new ForbiddenException("Insufficient permissions");
    }
}
