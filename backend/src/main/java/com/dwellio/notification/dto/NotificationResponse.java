package com.dwellio.notification.dto;

import com.dwellio.domain.entity.Notification;
import com.dwellio.domain.enums.NotificationStatus;
import com.dwellio.domain.enums.NotificationType;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        UUID userId,
        UUID organizationId,
        NotificationType type,
        String title,
        String body,
        Map<String, Object> payloadJson,
        NotificationStatus status,
        Instant createdAt,
        Instant readAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getUser().getId(),
                notification.getOrganization() != null ? notification.getOrganization().getId() : null,
                notification.getType(),
                notification.getTitle(),
                notification.getBody(),
                notification.getPayloadJson(),
                notification.getStatus(),
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }
}
