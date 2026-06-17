package com.dwellio.activity.dto;

import com.dwellio.domain.entity.ActivityEvent;
import com.dwellio.domain.enums.ActivityEventCategory;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ActivityEventResponse(
        UUID id,
        UUID membershipId,
        String residentName,
        ActivityEventCategory eventCategory,
        String eventType,
        String title,
        String description,
        Map<String, Object> metadata,
        Instant occurredAt
) {
    public static ActivityEventResponse from(ActivityEvent event) {
        return new ActivityEventResponse(
                event.getId(),
                event.getMembership() != null ? event.getMembership().getId() : null,
                event.getMembership() != null ? event.getMembership().getUser().getFullName() : null,
                event.getEventCategory(),
                event.getEventType(),
                event.getTitle(),
                event.getDescription(),
                event.getMetadata(),
                event.getOccurredAt()
        );
    }
}
