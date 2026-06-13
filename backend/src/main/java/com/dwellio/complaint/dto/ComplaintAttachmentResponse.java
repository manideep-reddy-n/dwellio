package com.dwellio.complaint.dto;

import com.dwellio.domain.entity.ComplaintAttachment;
import com.dwellio.domain.enums.AttachmentFileType;
import java.time.Instant;
import java.util.UUID;

public record ComplaintAttachmentResponse(
        UUID id,
        String cloudinaryUrl,
        AttachmentFileType fileType,
        Instant createdAt
) {
    public static ComplaintAttachmentResponse from(ComplaintAttachment attachment) {
        return new ComplaintAttachmentResponse(
                attachment.getId(),
                attachment.getCloudinaryUrl(),
                attachment.getFileType(),
                attachment.getCreatedAt()
        );
    }
}
