package com.dwellio.admin.dto;

public record AdminNotificationMetricsResponse(
        long activePushSubscriptions,
        long pushSentLast24Hours,
        long pushFailedLast24Hours,
        long pushSkippedLast24Hours,
        boolean inAppEnabledGlobally,
        boolean pushEnabledGlobally
) {
}
