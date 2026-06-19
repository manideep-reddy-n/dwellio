package com.dwellio.notification.dto;

import com.dwellio.domain.enums.NotificationPreferenceCategory;
import java.time.Instant;

public record NotificationPreferenceResponse(
        NotificationPreferenceCategory category,
        boolean inAppEnabled,
        boolean pushEnabled,
        boolean emailEnabled,
        Instant updatedAt
) {
}
