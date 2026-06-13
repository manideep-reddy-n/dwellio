package com.dwellio.notification.dto;

import java.util.List;

public record PagedNotificationResponse(
        List<NotificationResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
