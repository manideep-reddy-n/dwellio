package com.dwellio.notification.service;

import com.dwellio.auth.repository.UserRepository;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.entity.Notification;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.User;
import com.dwellio.domain.enums.NotificationStatus;
import com.dwellio.domain.enums.NotificationType;
import com.dwellio.notification.dto.NotificationResponse;
import com.dwellio.notification.dto.PagedNotificationResponse;
import com.dwellio.notification.dto.UnreadNotificationCountResponse;
import com.dwellio.common.event.AfterCommitEventPublisher;
import com.dwellio.notification.event.NotificationCreatedEvent;
import com.dwellio.notification.repository.NotificationRepository;
import com.dwellio.organization.repository.OrganizationRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    public static final int DEFAULT_PAGE_SIZE = 20;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final AfterCommitEventPublisher afterCommitEventPublisher;
    private final Clock clock;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Notification create(
            UUID userId,
            UUID organizationId,
            NotificationType type,
            String title,
            String body,
            Map<String, Object> payloadJson
    ) {
        User user = userRepository.findActiveById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Organization organization = null;
        if (organizationId != null) {
            organization = organizationRepository.findActiveById(organizationId)
                    .orElseThrow(() -> new NotFoundException("Organization not found"));
        }

        Notification notification = new Notification();
        notification.setId(UUID.randomUUID());
        notification.setUser(user);
        notification.setOrganization(organization);
        notification.setType(type);
        notification.setTitle(title);
        notification.setBody(body);
        if (payloadJson != null) {
            notification.setPayloadJson(payloadJson);
        }
        notification.setStatus(NotificationStatus.UNREAD);

        notification = notificationRepository.save(notification);
        afterCommitEventPublisher.publish(new NotificationCreatedEvent(notification.getId()));
        return notification;
    }

    @Transactional(readOnly = true)
    public PagedNotificationResponse listInbox(
            UUID userId,
            UUID organizationId,
            boolean unreadOnly,
            int page,
            int size
    ) {
        int pageSize = size > 0 ? Math.min(size, 100) : DEFAULT_PAGE_SIZE;
        Pageable pageable = PageRequest.of(Math.max(page, 0), pageSize);
        Page<Notification> results = notificationRepository.findInbox(
                userId,
                organizationId,
                unreadOnly,
                pageable
        );

        return new PagedNotificationResponse(
                results.getContent().stream().map(NotificationResponse::from).toList(),
                results.getNumber(),
                results.getSize(),
                results.getTotalElements(),
                results.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public UnreadNotificationCountResponse unreadCount(UUID userId) {
        long count = notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
        return new UnreadNotificationCountResponse(count);
    }

    @Transactional
    public NotificationResponse markRead(UUID userId, UUID notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new NotFoundException("Notification not found"));

        if (notification.getStatus() == NotificationStatus.UNREAD) {
            notification.setStatus(NotificationStatus.READ);
            notification.setReadAt(Instant.now(clock));
        }

        return NotificationResponse.from(notification);
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.markAllRead(userId, Instant.now(clock));
    }

    @Transactional(readOnly = true)
    public Notification getNotification(UUID notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("Notification not found"));
    }
}
