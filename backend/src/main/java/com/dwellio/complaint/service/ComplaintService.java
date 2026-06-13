package com.dwellio.complaint.service;

import com.dwellio.asset.repository.AssetRepository;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ForbiddenException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.common.security.MembershipContext;
import com.dwellio.complaint.dto.AddComplaintAttachmentRequest;
import com.dwellio.complaint.dto.AssignComplaintRequest;
import com.dwellio.complaint.dto.ComplaintAttachmentResponse;
import com.dwellio.complaint.dto.ComplaintResponse;
import com.dwellio.complaint.dto.CreateComplaintRequest;
import com.dwellio.complaint.dto.UpdateComplaintRequest;
import com.dwellio.complaint.event.ComplaintAssignedEvent;
import com.dwellio.complaint.event.ComplaintCreatedEvent;
import com.dwellio.complaint.event.ComplaintEventPublisher;
import com.dwellio.complaint.event.ComplaintReopenedEvent;
import com.dwellio.complaint.event.ComplaintResolvedEvent;
import com.dwellio.complaint.repository.ComplaintAttachmentRepository;
import com.dwellio.complaint.repository.ComplaintRepository;
import com.dwellio.domain.entity.Asset;
import com.dwellio.domain.entity.Complaint;
import com.dwellio.domain.entity.ComplaintAttachment;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.enums.ComplaintCategory;
import com.dwellio.domain.enums.ComplaintPriority;
import com.dwellio.domain.enums.ComplaintStatus;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.operations.service.OperationsGuard;
import java.time.Clock;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private static final Set<ComplaintStatus> OPEN_STATUSES = EnumSet.of(
            ComplaintStatus.OPEN,
            ComplaintStatus.IN_PROGRESS,
            ComplaintStatus.REOPENED
    );

    private static final Set<ComplaintStatus> RESOLVABLE_STATUSES = EnumSet.of(
            ComplaintStatus.OPEN,
            ComplaintStatus.IN_PROGRESS,
            ComplaintStatus.REOPENED
    );

    private static final Set<ComplaintStatus> REOPENABLE_STATUSES = EnumSet.of(
            ComplaintStatus.RESOLVED,
            ComplaintStatus.CLOSED
    );

    private final ComplaintRepository complaintRepository;
    private final ComplaintAttachmentRepository attachmentRepository;
    private final AssetRepository assetRepository;
    private final MembershipRepository membershipRepository;
    private final OperationsGuard operationsGuard;
    private final AuthorizationService authorizationService;
    private final ComplaintEventPublisher eventPublisher;
    private final Clock clock;

    @Transactional
    public ComplaintResponse create(UUID organizationId, CreateComplaintRequest request) {
        MembershipContext context = authorizationService.requirePermission(organizationId, "complaint:create");
        Organization organization = operationsGuard.requireOrganization(organizationId);
        Membership creator = getMembership(organizationId, context.getMembershipId());

        Complaint complaint = new Complaint();
        complaint.setId(UUID.randomUUID());
        complaint.setOrganization(organization);
        complaint.setCreatedByMembership(creator);
        complaint.setTitle(request.title().trim());
        complaint.setDescription(request.description().trim());
        complaint.setCategory(request.category());
        complaint.setPriority(request.priority() != null ? request.priority() : ComplaintPriority.MEDIUM);
        complaint.setStatus(ComplaintStatus.OPEN);
        complaint.setAsset(resolveAsset(organizationId, request.assetId()));

        complaint = complaintRepository.save(complaint);
        publishMetrics(organizationId);
        eventPublisher.publishCreated(new ComplaintCreatedEvent(
                organizationId,
                complaint.getId(),
                complaint.getTitle(),
                creator.getUser().getId()
        ));
        return toResponse(complaint);
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponse> listAll(UUID organizationId, ComplaintCategory category) {
        operationsGuard.requireOrganization(organizationId);
        return complaintRepository.findAllActiveByOrganizationId(organizationId, category).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponse> listMine(UUID organizationId, ComplaintCategory category) {
        MembershipContext context = authorizationService.requirePermission(organizationId, "complaint:read_own");
        operationsGuard.requireOrganization(organizationId);
        return complaintRepository.findAllActiveByOrganizationIdAndCreatedByMembershipId(
                        organizationId,
                        context.getMembershipId(),
                        category
                ).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ComplaintResponse get(UUID organizationId, UUID complaintId) {
        Complaint complaint = getActiveComplaint(organizationId, complaintId);
        requireReadAccess(organizationId, complaint);
        return toResponse(complaint);
    }

    @Transactional
    public ComplaintResponse update(UUID organizationId, UUID complaintId, UpdateComplaintRequest request) {
        authorizationService.requirePermission(organizationId, "complaint:manage");
        Complaint complaint = getActiveComplaint(organizationId, complaintId);
        ensureNotClosed(complaint);

        if (request.priority() != null) {
            complaint.setPriority(request.priority());
        }
        if (request.category() != null) {
            complaint.setCategory(request.category());
        }
        if (request.assetId() != null) {
            complaint.setAsset(resolveAsset(organizationId, request.assetId()));
        }

        publishMetrics(organizationId);
        return toResponse(complaint);
    }

    @Transactional
    public ComplaintResponse assign(UUID organizationId, UUID complaintId, AssignComplaintRequest request) {
        authorizationService.requirePermission(organizationId, "complaint:assign");
        Complaint complaint = getActiveComplaint(organizationId, complaintId);
        ensureNotClosed(complaint);

        Membership assignee = membershipRepository.findActiveByIdAndOrganizationId(
                        request.assigneeMembershipId(),
                        organizationId
                )
                .orElseThrow(() -> new NotFoundException("Assignee membership not found"));
        operationsGuard.requireStaffMembership(assignee);

        Instant now = Instant.now(clock);
        complaint.setAssignedToMembership(assignee);
        if (complaint.getAssignedAt() == null) {
            complaint.setAssignedAt(now);
        }
        recordFirstResponse(complaint, now);

        if (complaint.getStatus() == ComplaintStatus.OPEN || complaint.getStatus() == ComplaintStatus.REOPENED) {
            complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        }

        publishMetrics(organizationId);
        eventPublisher.publishAssigned(new ComplaintAssignedEvent(
                organizationId,
                complaint.getId(),
                complaint.getTitle(),
                assignee.getUser().getId()
        ));
        return toResponse(complaint);
    }

    @Transactional
    public ComplaintResponse start(UUID organizationId, UUID complaintId) {
        authorizationService.requirePermission(organizationId, "complaint:manage");
        Complaint complaint = getActiveComplaint(organizationId, complaintId);
        ensureNotClosed(complaint);

        if (complaint.getStatus() != ComplaintStatus.OPEN && complaint.getStatus() != ComplaintStatus.REOPENED) {
            throw new BadRequestException("Only open or reopened complaints can be started");
        }

        recordFirstResponse(complaint, Instant.now(clock));
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        publishMetrics(organizationId);
        return toResponse(complaint);
    }

    @Transactional
    public ComplaintResponse resolve(UUID organizationId, UUID complaintId) {
        authorizationService.requirePermission(organizationId, "complaint:manage");
        Complaint complaint = getActiveComplaint(organizationId, complaintId);

        if (!RESOLVABLE_STATUSES.contains(complaint.getStatus())) {
            throw new BadRequestException("Complaint cannot be resolved from status " + complaint.getStatus());
        }

        Instant now = Instant.now(clock);
        if (complaint.getStatus() == ComplaintStatus.OPEN || complaint.getStatus() == ComplaintStatus.REOPENED) {
            recordFirstResponse(complaint, now);
        }

        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolvedAt(now);
        publishMetrics(organizationId);
        eventPublisher.publishResolved(new ComplaintResolvedEvent(
                organizationId,
                complaint.getId(),
                complaint.getTitle(),
                complaint.getCreatedByMembership().getUser().getId()
        ));
        return toResponse(complaint);
    }

    @Transactional
    public ComplaintResponse close(UUID organizationId, UUID complaintId) {
        authorizationService.requirePermission(organizationId, "complaint:manage");
        Complaint complaint = getActiveComplaint(organizationId, complaintId);

        if (complaint.getStatus() != ComplaintStatus.RESOLVED) {
            throw new BadRequestException("Only resolved complaints can be closed");
        }

        complaint.setStatus(ComplaintStatus.CLOSED);
        complaint.setClosedAt(Instant.now(clock));
        publishMetrics(organizationId);
        return toResponse(complaint);
    }

    @Transactional
    public ComplaintResponse reopen(UUID organizationId, UUID complaintId) {
        authorizationService.requirePermission(organizationId, "complaint:manage");
        Complaint complaint = getActiveComplaint(organizationId, complaintId);

        if (!REOPENABLE_STATUSES.contains(complaint.getStatus())) {
            throw new BadRequestException("Only resolved or closed complaints can be reopened");
        }

        UUID previousAssigneeUserId = complaint.getAssignedToMembership() != null
                ? complaint.getAssignedToMembership().getUser().getId()
                : null;

        complaint.setStatus(ComplaintStatus.REOPENED);
        complaint.setResolvedAt(null);
        complaint.setClosedAt(null);
        complaint.setAssignedAt(null);
        complaint.setFirstResponseAt(null);
        complaint.setAssignedToMembership(null);

        publishMetrics(organizationId);
        eventPublisher.publishReopened(new ComplaintReopenedEvent(
                organizationId,
                complaint.getId(),
                complaint.getTitle(),
                complaint.getCreatedByMembership().getUser().getId(),
                previousAssigneeUserId
        ));
        return toResponse(complaint);
    }

    @Transactional
    public ComplaintAttachmentResponse addAttachment(
            UUID organizationId,
            UUID complaintId,
            AddComplaintAttachmentRequest request
    ) {
        Complaint complaint = getActiveComplaint(organizationId, complaintId);
        requireAttachmentAccess(organizationId, complaint);
        ensureNotClosed(complaint);

        ComplaintAttachment attachment = new ComplaintAttachment();
        attachment.setId(UUID.randomUUID());
        attachment.setComplaint(complaint);
        attachment.setCloudinaryUrl(request.cloudinaryUrl().trim());
        attachment.setFileType(request.fileType());
        attachment = attachmentRepository.save(attachment);
        return ComplaintAttachmentResponse.from(attachment);
    }

    @Transactional
    public void delete(UUID organizationId, UUID complaintId) {
        authorizationService.requirePermission(organizationId, "complaint:manage");
        Complaint complaint = getActiveComplaint(organizationId, complaintId);
        complaint.setDeletedAt(Instant.now(clock));
        publishMetrics(organizationId);
    }

    private Complaint getActiveComplaint(UUID organizationId, UUID complaintId) {
        operationsGuard.requireOrganization(organizationId);
        return complaintRepository.findActiveByIdAndOrganizationId(complaintId, organizationId)
                .orElseThrow(() -> new NotFoundException("Complaint not found"));
    }

    private Asset resolveAsset(UUID organizationId, UUID assetId) {
        if (assetId == null) {
            return null;
        }
        Asset asset = assetRepository.findActiveByIdAndOrganizationId(assetId, organizationId)
                .orElseThrow(() -> new NotFoundException("Asset not found"));
        operationsGuard.requireAssetOrganization(organizationId, asset);
        return asset;
    }

    private void requireReadAccess(UUID organizationId, Complaint complaint) {
        MembershipContext context = authorizationService.requireMembership(organizationId);
        if (context.isOwner() || context.hasPermission("complaint:read")) {
            return;
        }
        if (context.hasPermission("complaint:read_own")
                && complaint.getCreatedByMembership().getId().equals(context.getMembershipId())) {
            return;
        }
        throw new ForbiddenException("Insufficient permissions");
    }

    private void requireAttachmentAccess(UUID organizationId, Complaint complaint) {
        MembershipContext context = authorizationService.requireMembership(organizationId);
        if (context.isOwner() || context.hasPermission("complaint:manage")) {
            return;
        }
        if (context.hasPermission("complaint:create")
                && complaint.getCreatedByMembership().getId().equals(context.getMembershipId())
                && OPEN_STATUSES.contains(complaint.getStatus())) {
            return;
        }
        throw new ForbiddenException("Insufficient permissions");
    }

    private void ensureNotClosed(Complaint complaint) {
        if (complaint.getStatus() == ComplaintStatus.CLOSED) {
            throw new BadRequestException("Closed complaints cannot be modified");
        }
    }

    private void recordFirstResponse(Complaint complaint, Instant timestamp) {
        if (complaint.getFirstResponseAt() == null) {
            complaint.setFirstResponseAt(timestamp);
        }
    }

    private ComplaintResponse toResponse(Complaint complaint) {
        List<ComplaintAttachment> attachments = attachmentRepository.findAllByComplaintId(complaint.getId());
        return ComplaintResponse.from(complaint, attachments);
    }

    private Membership getMembership(UUID organizationId, UUID membershipId) {
        return membershipRepository.findActiveByIdAndOrganizationId(membershipId, organizationId)
                .orElseThrow(() -> new NotFoundException("Membership not found"));
    }

    private void publishMetrics(UUID organizationId) {
        eventPublisher.publishMetricsChanged(organizationId);
    }
}
