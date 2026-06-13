package com.dwellio.announcement.dto;

import com.dwellio.domain.entity.Announcement;
import com.dwellio.domain.enums.AnnouncementType;
import java.time.Instant;
import java.util.UUID;

public record AnnouncementResponse(
        UUID id,
        UUID organizationId,
        UUID createdByUserId,
        String title,
        String content,
        AnnouncementType type,
        Instant publishedAt,
        Instant createdAt,
        Instant updatedAt,
        boolean published
) {
    public static AnnouncementResponse from(Announcement announcement) {
        return new AnnouncementResponse(
                announcement.getId(),
                announcement.getOrganization().getId(),
                announcement.getCreatedBy().getId(),
                announcement.getTitle(),
                announcement.getContent(),
                announcement.getType(),
                announcement.getPublishedAt(),
                announcement.getCreatedAt(),
                announcement.getUpdatedAt(),
                announcement.getPublishedAt() != null
        );
    }
}
