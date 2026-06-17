package com.dwellio.joinrequest.service;

import com.dwellio.auth.repository.UserRepository;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ConflictException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.entity.JoinRequest;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.ResidentProfile;
import com.dwellio.domain.entity.Role;
import com.dwellio.domain.entity.User;
import com.dwellio.activity.ActivityEventTypes;
import com.dwellio.activity.service.ActivityEventRecorder;
import com.dwellio.domain.enums.ActivityEventCategory;
import com.dwellio.domain.enums.JoinRequestStatus;
import com.dwellio.domain.enums.MembershipStatus;
import com.dwellio.domain.enums.ResidentStatus;
import com.dwellio.joinrequest.dto.JoinRequestResponse;
import com.dwellio.joinrequest.dto.RejectJoinRequestRequest;
import com.dwellio.joinrequest.dto.SubmitJoinRequestRequest;
import com.dwellio.joinrequest.repository.JoinRequestRepository;
import com.dwellio.joinrequest.repository.ResidentProfileRepository;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.common.event.AfterCommitEventPublisher;
import com.dwellio.joinrequest.event.JoinRequestRejectedEvent;
import com.dwellio.joinrequest.event.JoinRequestSubmittedEvent;
import com.dwellio.metrics.event.MembershipActivatedEvent;
import com.dwellio.organization.service.OrganizationService;
import com.dwellio.role.service.RoleService;
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
public class JoinRequestService {

    private static final String SOURCE_JOIN_REQUEST = "JOIN_REQUEST";
    private static final String SOURCE_MEMBERSHIP = "MEMBERSHIP";

    private final JoinRequestRepository joinRequestRepository;
    private final MembershipRepository membershipRepository;
    private final ResidentProfileRepository residentProfileRepository;
    private final UserRepository userRepository;
    private final OrganizationService organizationService;
    private final RoleService roleService;
    private final Clock clock;
    private final AfterCommitEventPublisher afterCommitEventPublisher;
    private final ActivityEventRecorder activityEventRecorder;

    @Transactional
    public JoinRequestResponse submit(UUID organizationId, UUID userId, SubmitJoinRequestRequest request) {
        Organization organization = organizationService.findActiveOrganization(organizationId);
        User user = userRepository.findActiveById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (membershipRepository.existsActiveByUserIdAndOrganizationId(userId, organizationId)) {
            throw new ConflictException("You are already a member of this organization");
        }
        if (joinRequestRepository.existsPendingByUserIdAndOrganizationId(userId, organizationId)) {
            throw new ConflictException("A pending join request already exists");
        }

        JoinRequest joinRequest = new JoinRequest();
        joinRequest.setId(UUID.randomUUID());
        joinRequest.setUser(user);
        joinRequest.setOrganization(organization);
        joinRequest.setStatus(JoinRequestStatus.PENDING);
        joinRequest.setMessage(request.message());
        joinRequest.setEmergencyContactName(trimToNull(request.emergencyContactName()));
        joinRequest.setEmergencyContactPhone(trimToNull(request.emergencyContactPhone()));
        joinRequestRepository.save(joinRequest);

        afterCommitEventPublisher.publish(new JoinRequestSubmittedEvent(
                organizationId,
                joinRequest.getId(),
                user.getId(),
                user.getFullName(),
                organization.getName(),
                organization.getSlug()
        ));

        return toResponse(joinRequest);
    }

    @Transactional(readOnly = true)
    public List<JoinRequestResponse> list(UUID organizationId) {
        organizationService.findActiveOrganization(organizationId);
        return joinRequestRepository.findAllByOrganizationId(organizationId).stream()
                .map(JoinRequestService::toResponse)
                .toList();
    }

    @Transactional
    public JoinRequestResponse approve(UUID organizationId, UUID joinRequestId, UUID reviewerUserId) {
        JoinRequest joinRequest = getPendingJoinRequest(organizationId, joinRequestId);
        User reviewer = userRepository.findActiveById(reviewerUserId)
                .orElseThrow(() -> new NotFoundException("Reviewer not found"));

        if (membershipRepository.existsActiveByUserIdAndOrganizationId(
                joinRequest.getUser().getId(), organizationId)) {
            throw new ConflictException("User already has an active membership");
        }

        Role residentRole = roleService.getResidentRole(organizationId);

        Membership membership = new Membership();
        membership.setId(UUID.randomUUID());
        membership.setUser(joinRequest.getUser());
        membership.setOrganization(joinRequest.getOrganization());
        membership.setRole(residentRole);
        membership.setStatus(MembershipStatus.ACTIVE);
        membership.setJoinedAt(clock.instant());
        membershipRepository.save(membership);

        ResidentProfile profile = new ResidentProfile();
        profile.setId(UUID.randomUUID());
        profile.setMembership(membership);
        profile.setEmergencyContactName(joinRequest.getEmergencyContactName());
        profile.setEmergencyContactPhone(joinRequest.getEmergencyContactPhone());
        profile.setStatus(ResidentStatus.ACTIVE);
        residentProfileRepository.save(profile);

        joinRequest.setStatus(JoinRequestStatus.APPROVED);
        joinRequest.setReviewedBy(reviewer);
        joinRequest.setReviewedAt(clock.instant());
        joinRequestRepository.save(joinRequest);

        Instant approvedAt = clock.instant();
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("joinRequestId", joinRequest.getId().toString());
        metadata.put("membershipId", membership.getId().toString());

        activityEventRecorder.record(
                organizationId,
                membership.getId(),
                ActivityEventCategory.MEMBERSHIP,
                ActivityEventTypes.MEMBERSHIP_APPROVED,
                "Membership approved",
                joinRequest.getUser().getFullName() + " was approved",
                metadata,
                approvedAt,
                SOURCE_JOIN_REQUEST,
                joinRequest.getId()
        );
        activityEventRecorder.record(
                organizationId,
                membership.getId(),
                ActivityEventCategory.MEMBERSHIP,
                ActivityEventTypes.MEMBERSHIP_JOINED,
                "Joined organization",
                joinRequest.getUser().getFullName() + " became a member",
                metadata,
                approvedAt,
                SOURCE_MEMBERSHIP,
                membership.getId()
        );

        afterCommitEventPublisher.publish(new MembershipActivatedEvent(
                organizationId,
                membership.getId(),
                joinRequest.getUser().getId()
        ));

        return toResponse(joinRequest);
    }

    @Transactional
    public JoinRequestResponse reject(
            UUID organizationId,
            UUID joinRequestId,
            UUID reviewerUserId,
            RejectJoinRequestRequest request
    ) {
        JoinRequest joinRequest = getPendingJoinRequest(organizationId, joinRequestId);
        User reviewer = userRepository.findActiveById(reviewerUserId)
                .orElseThrow(() -> new NotFoundException("Reviewer not found"));

        joinRequest.setStatus(JoinRequestStatus.REJECTED);
        joinRequest.setReviewedBy(reviewer);
        joinRequest.setReviewedAt(clock.instant());
        joinRequest.setRejectionReason(request.rejectionReason());
        joinRequestRepository.save(joinRequest);

        afterCommitEventPublisher.publish(new JoinRequestRejectedEvent(
                organizationId,
                joinRequest.getId(),
                joinRequest.getUser().getId(),
                joinRequest.getOrganization().getName(),
                joinRequest.getOrganization().getSlug(),
                request.rejectionReason()
        ));

        return toResponse(joinRequest);
    }

    @Transactional
    public JoinRequestResponse cancel(UUID organizationId, UUID joinRequestId, UUID userId) {
        JoinRequest joinRequest = joinRequestRepository.findByIdAndOrganizationId(joinRequestId, organizationId)
                .orElseThrow(() -> new NotFoundException("Join request not found"));

        if (!joinRequest.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only cancel your own join request");
        }
        if (joinRequest.getStatus() != JoinRequestStatus.PENDING) {
            throw new BadRequestException("Only pending join requests can be cancelled");
        }

        joinRequest.setStatus(JoinRequestStatus.CANCELLED);
        joinRequestRepository.save(joinRequest);
        return toResponse(joinRequest);
    }

    private JoinRequest getPendingJoinRequest(UUID organizationId, UUID joinRequestId) {
        JoinRequest joinRequest = joinRequestRepository.findByIdAndOrganizationId(joinRequestId, organizationId)
                .orElseThrow(() -> new NotFoundException("Join request not found"));
        if (joinRequest.getStatus() != JoinRequestStatus.PENDING) {
            throw new BadRequestException("Join request is not pending");
        }
        return joinRequest;
    }

    static JoinRequestResponse toResponse(JoinRequest joinRequest) {
        return new JoinRequestResponse(
                joinRequest.getId(),
                joinRequest.getUser().getId(),
                joinRequest.getUser().getEmail(),
                joinRequest.getUser().getFullName(),
                joinRequest.getUser().getPhone(),
                joinRequest.getStatus(),
                joinRequest.getMessage(),
                joinRequest.getEmergencyContactName(),
                joinRequest.getEmergencyContactPhone(),
                joinRequest.getCreatedAt(),
                joinRequest.getReviewedAt(),
                joinRequest.getRejectionReason()
        );
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
