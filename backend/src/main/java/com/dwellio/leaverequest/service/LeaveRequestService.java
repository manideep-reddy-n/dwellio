package com.dwellio.leaverequest.service;

import com.dwellio.common.event.AfterCommitEventPublisher;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ConflictException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.domain.entity.LeaveRequest;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.User;
import com.dwellio.domain.enums.LeaveRequestStatus;
import com.dwellio.domain.enums.MembershipStatus;
import com.dwellio.domain.enums.NotificationType;
import com.dwellio.leaverequest.dto.LeaveRequestResponse;
import com.dwellio.leaverequest.dto.SubmitLeaveRequestRequest;
import com.dwellio.leaverequest.event.LeaveRequestSubmittedEvent;
import com.dwellio.leaverequest.repository.LeaveRequestRepository;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.notification.service.NotificationService;
import com.dwellio.organization.service.OrganizationService;
import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final MembershipRepository membershipRepository;
    private final OrganizationService organizationService;
    private final AuthorizationService authorizationService;
    private final NotificationService notificationService;
    private final AfterCommitEventPublisher afterCommitEventPublisher;
    private final Clock clock;

    @Transactional
    public LeaveRequestResponse submit(UUID userId, UUID organizationId, SubmitLeaveRequestRequest request) {
        Organization organization = organizationService.findActiveOrganization(organizationId);
        Membership membership = membershipRepository.findActiveByUserIdAndOrganizationId(userId, organizationId)
                .orElseThrow(() -> new NotFoundException("Active membership not found"));

        if (membership.getRole().isOwnerRole()) {
            throw new BadRequestException("Property owners cannot leave their organization.");
        }

        if (leaveRequestRepository.findPendingByUserAndOrganization(
                userId, organizationId, LeaveRequestStatus.PENDING).isPresent()) {
            throw new ConflictException("A pending leave request already exists");
        }

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setId(UUID.randomUUID());
        leaveRequest.setMembership(membership);
        leaveRequest.setOrganization(organization);
        leaveRequest.setUser(membership.getUser());
        leaveRequest.setStatus(LeaveRequestStatus.PENDING);
        leaveRequest.setReason(request.reason());
        leaveRequestRepository.save(leaveRequest);

        afterCommitEventPublisher.publish(new LeaveRequestSubmittedEvent(
                organizationId,
                leaveRequest.getId(),
                userId,
                membership.getUser().getFullName(),
                organization.getName(),
                organization.getSlug()
        ));

        return toResponse(leaveRequest);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> list(UUID organizationId) {
        authorizationService.requirePermission(organizationId, "resident:manage");
        return leaveRequestRepository.findAllByOrganizationId(organizationId).stream()
                .map(LeaveRequestService::toResponse)
                .toList();
    }

    @Transactional
    public LeaveRequestResponse approve(UUID organizationId, UUID leaveRequestId, UUID reviewerUserId) {
        authorizationService.requirePermission(organizationId, "resident:manage");
        LeaveRequest leaveRequest = getPending(organizationId, leaveRequestId);
        User reviewer = referenceUser(reviewerUserId);

        Membership membership = leaveRequest.getMembership();
        membership.setStatus(MembershipStatus.LEFT);
        membership.setLeftAt(clock.instant());
        membership.setExitReason("Leave approved by property team");

        leaveRequest.setStatus(LeaveRequestStatus.APPROVED);
        leaveRequest.setReviewedBy(reviewer);
        leaveRequest.setReviewedAt(Instant.now(clock));

        notifyResident(
                leaveRequest,
                NotificationType.LEAVE_REQUEST_APPROVED,
                "Leave request approved",
                "Your request to leave %s has been approved.".formatted(leaveRequest.getOrganization().getName())
        );

        return toResponse(leaveRequest);
    }

    @Transactional
    public LeaveRequestResponse reject(UUID organizationId, UUID leaveRequestId, UUID reviewerUserId) {
        authorizationService.requirePermission(organizationId, "resident:manage");
        LeaveRequest leaveRequest = getPending(organizationId, leaveRequestId);
        leaveRequest.setStatus(LeaveRequestStatus.REJECTED);
        leaveRequest.setReviewedBy(referenceUser(reviewerUserId));
        leaveRequest.setReviewedAt(Instant.now(clock));

        notifyResident(
                leaveRequest,
                NotificationType.LEAVE_REQUEST_REJECTED,
                "Leave request declined",
                "Your request to leave %s was declined. Contact your property team for details."
                        .formatted(leaveRequest.getOrganization().getName())
        );

        return toResponse(leaveRequest);
    }

    private LeaveRequest getPending(UUID organizationId, UUID leaveRequestId) {
        LeaveRequest leaveRequest = leaveRequestRepository.findByIdAndOrganizationId(leaveRequestId, organizationId)
                .orElseThrow(() -> new NotFoundException("Leave request not found"));
        if (leaveRequest.getStatus() != LeaveRequestStatus.PENDING) {
            throw new BadRequestException("Leave request is not pending");
        }
        return leaveRequest;
    }

    private void notifyResident(
            LeaveRequest leaveRequest,
            NotificationType type,
            String title,
            String body
    ) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("organizationId", leaveRequest.getOrganization().getId().toString());
        payload.put("organizationSlug", leaveRequest.getOrganization().getSlug());
        payload.put("leaveRequestId", leaveRequest.getId().toString());
        notificationService.create(
                leaveRequest.getUser().getId(),
                leaveRequest.getOrganization().getId(),
                type,
                title,
                body,
                payload
        );
    }

    private static User referenceUser(UUID userId) {
        User user = new User();
        user.setId(userId);
        return user;
    }

    static LeaveRequestResponse toResponse(LeaveRequest leaveRequest) {
        return new LeaveRequestResponse(
                leaveRequest.getId(),
                leaveRequest.getMembership().getId(),
                leaveRequest.getUser().getId(),
                leaveRequest.getUser().getFullName(),
                leaveRequest.getUser().getEmail(),
                leaveRequest.getStatus(),
                leaveRequest.getReason(),
                leaveRequest.getCreatedAt(),
                leaveRequest.getReviewedAt()
        );
    }
}
