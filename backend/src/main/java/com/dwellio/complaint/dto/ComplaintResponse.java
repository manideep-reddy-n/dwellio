package com.dwellio.complaint.dto;

import com.dwellio.domain.entity.Complaint;
import com.dwellio.domain.entity.ComplaintAttachment;
import com.dwellio.domain.enums.ComplaintCategory;
import com.dwellio.domain.enums.ComplaintPriority;
import com.dwellio.domain.enums.ComplaintStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ComplaintResponse(
        UUID id,
        UUID organizationId,
        UUID createdByMembershipId,
        UUID assignedToMembershipId,
        UUID assetId,
        String title,
        String description,
        ComplaintCategory category,
        ComplaintPriority priority,
        ComplaintStatus status,
        Instant resolvedAt,
        Instant closedAt,
        Instant assignedAt,
        Instant firstResponseAt,
        Instant createdAt,
        Instant updatedAt,
        List<ComplaintAttachmentResponse> attachments,
        Boolean slaBreached
) {
    public static ComplaintResponse from(Complaint complaint, List<ComplaintAttachment> attachments) {
        return from(complaint, attachments, null);
    }

    public static ComplaintResponse from(
            Complaint complaint,
            List<ComplaintAttachment> attachments,
            Boolean slaBreached
    ) {
        return new ComplaintResponse(
                complaint.getId(),
                complaint.getOrganization().getId(),
                complaint.getCreatedByMembership().getId(),
                complaint.getAssignedToMembership() != null ? complaint.getAssignedToMembership().getId() : null,
                complaint.getAsset() != null ? complaint.getAsset().getId() : null,
                complaint.getTitle(),
                complaint.getDescription(),
                complaint.getCategory(),
                complaint.getPriority(),
                complaint.getStatus(),
                complaint.getResolvedAt(),
                complaint.getClosedAt(),
                complaint.getAssignedAt(),
                complaint.getFirstResponseAt(),
                complaint.getCreatedAt(),
                complaint.getUpdatedAt(),
                attachments.stream().map(ComplaintAttachmentResponse::from).toList(),
                slaBreached
        );
    }
}
