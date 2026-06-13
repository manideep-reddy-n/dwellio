package com.dwellio.notification.event;

import java.util.UUID;

public record AnnouncementPublishedEvent(
        UUID organizationId,
        UUID announcementId,
        String title
) {
}
