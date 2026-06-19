package com.dwellio.notification.dto;

import com.dwellio.domain.enums.NotificationDeliveryChannel;
import com.dwellio.domain.enums.NotificationDeliveryStatus;
import java.time.Instant;
import java.util.UUID;

public record NotificationDeliveryLogResponse(
        UUID id,
        UUID notificationId,
        UUID userId,
        NotificationDeliveryChannel channel,
        NotificationDeliveryStatus status,
        String errorMessage,
        Instant createdAt
) {
}
