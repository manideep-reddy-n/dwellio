package com.dwellio.announcement.dto;

import com.dwellio.domain.enums.AnnouncementType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAnnouncementRequest(
        @NotBlank @Size(max = 255) String title,
        @NotBlank String content,
        @NotNull AnnouncementType type
) {
}
