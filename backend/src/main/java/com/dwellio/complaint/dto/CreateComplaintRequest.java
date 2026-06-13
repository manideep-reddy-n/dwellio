package com.dwellio.complaint.dto;

import com.dwellio.domain.enums.AttachmentFileType;
import com.dwellio.domain.enums.ComplaintCategory;
import com.dwellio.domain.enums.ComplaintPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateComplaintRequest(
        @NotBlank @Size(max = 255) String title,
        @NotBlank String description,
        @NotNull ComplaintCategory category,
        ComplaintPriority priority,
        UUID assetId
) {
}
