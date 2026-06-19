package com.dwellio.notification.dto;

public record UpdateNotificationPreferenceRequest(
        Boolean inAppEnabled,
        Boolean pushEnabled,
        Boolean emailEnabled
) {
}
