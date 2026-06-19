package com.dwellio.admin.service;

import com.dwellio.admin.dto.AdminComplaintSummary;
import com.dwellio.admin.dto.AdminPagedResponse;
import com.dwellio.admin.dto.UpdateAdminComplaintRequest;
import com.dwellio.audit.service.PlatformAuditService;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.complaint.repository.ComplaintRepository;
import com.dwellio.domain.entity.Complaint;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.enums.ComplaintStatus;
import com.dwellio.membership.repository.MembershipRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminComplaintService {

    private final ComplaintRepository complaintRepository;
    private final MembershipRepository membershipRepository;
    private final AuthorizationService authorizationService;
    private final PlatformAuditService auditService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public AdminPagedResponse<AdminComplaintSummary> list(ComplaintStatus status, String query, int page, int size) {
        authorizationService.requirePlatformAdmin();
        Page<Complaint> complaints = complaintRepository.searchForAdmin(
                status,
                normalize(query),
                PageRequest.of(page, size)
        );
        return AdminPagedResponse.of(
                complaints.map(this::toSummary).getContent(),
                page,
                size,
                complaints.getTotalElements()
        );
    }

    @Transactional
    public AdminComplaintSummary update(UUID complaintId, UpdateAdminComplaintRequest request) {
        authorizationService.requirePlatformAdmin();
        Complaint complaint = complaintRepository.findActiveByIdForAdmin(complaintId)
                .orElseThrow(() -> new NotFoundException("Complaint not found"));

        ComplaintStatus previousStatus = complaint.getStatus();
        if (request.status() != null) {
            complaint.setStatus(request.status());
            if (request.status() == ComplaintStatus.RESOLVED || request.status() == ComplaintStatus.CLOSED) {
                complaint.setResolvedAt(Instant.now(clock));
            }
        }
        if (request.assignedToMembershipId() != null) {
            Membership membership = membershipRepository.findActiveByIdAndOrganizationId(
                    request.assignedToMembershipId(),
                    complaint.getOrganization().getId()
            ).orElseThrow(() -> new NotFoundException("Assignee membership not found"));
            complaint.setAssignedToMembership(membership);
        }

        Complaint saved = complaintRepository.save(complaint);
        auditService.recordForCurrentUser(
                "COMPLAINT_MODERATED",
                "COMPLAINT",
                complaintId,
                complaint.getOrganization().getId(),
                previousStatus.name(),
                saved.getStatus().name()
        );
        return toSummary(saved);
    }

    private AdminComplaintSummary toSummary(Complaint complaint) {
        return new AdminComplaintSummary(
                complaint.getId(),
                complaint.getOrganization().getId(),
                complaint.getOrganization().getName(),
                complaint.getTitle(),
                complaint.getCategory(),
                complaint.getPriority(),
                complaint.getStatus(),
                complaint.getCreatedByMembership().getUser().getFullName(),
                complaint.getAssignedToMembership() != null
                        ? complaint.getAssignedToMembership().getUser().getFullName()
                        : null,
                complaint.getCreatedAt(),
                complaint.getResolvedAt()
        );
    }

    private static String normalize(String query) {
        return query == null || query.isBlank() ? null : query.trim();
    }
}
