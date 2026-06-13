package com.dwellio.complaint.dto;

import com.dwellio.domain.enums.AttachmentFileType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AddComplaintAttachmentRequest(
        @NotBlank @Size(max = 500) String cloudinaryUrl,
        @NotNull AttachmentFileType fileType
) {
}
