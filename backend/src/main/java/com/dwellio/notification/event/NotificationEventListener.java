package com.dwellio.notification.event;

import com.dwellio.accommodation.event.OccupancyAllocatedEvent;
import com.dwellio.accommodation.event.OccupancyTransferredEvent;
import com.dwellio.complaint.event.ComplaintAssignedEvent;
import com.dwellio.complaint.event.ComplaintCreatedEvent;
import com.dwellio.complaint.event.ComplaintReopenedEvent;
import com.dwellio.complaint.event.ComplaintResolvedEvent;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.enums.NotificationType;
import com.dwellio.joinrequest.event.JoinRequestRejectedEvent;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.metrics.event.MembershipActivatedEvent;
import com.dwellio.notification.service.NotificationDeliveryService;
import com.dwellio.notification.service.NotificationService;
import com.dwellio.organization.repository.OrganizationRepository;
import com.dwellio.review.event.ReviewReportedEvent;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final NotificationDeliveryService notificationDeliveryService;
    private final MembershipRepository membershipRepository;
    private final OrganizationRepository organizationRepository;

    @EventListener
    public void onMembershipActivated(MembershipActivatedEvent event) {
        String orgName = organizationRepository.findActiveById(event.organizationId())
                .map(org -> org.getName())
                .orElse("your organization");

        notificationService.create(
                event.userId(),
                event.organizationId(),
                NotificationType.JOIN_REQUEST_APPROVED,
                "Join request approved",
                "Your request to join %s has been approved.".formatted(orgName),
                payload("organizationId", event.organizationId(), "membershipId", event.membershipId())
        );
    }

    @EventListener
    public void onJoinRequestRejected(JoinRequestRejectedEvent event) {
        notificationService.create(
                event.userId(),
                event.organizationId(),
                NotificationType.JOIN_REQUEST_REJECTED,
                "Join request rejected",
                "Your request to join %s was rejected.".formatted(event.organizationName()),
                payload(
                        "organizationId", event.organizationId(),
                        "joinRequestId", event.joinRequestId(),
                        "rejectionReason", event.rejectionReason()
                )
        );
    }

    @EventListener
    public void onComplaintCreated(ComplaintCreatedEvent event) {
        Set<UUID> notifiedUsers = new LinkedHashSet<>();
        for (Membership staff : membershipRepository.findActiveComplaintStaffByOrganizationId(event.organizationId())) {
            UUID userId = staff.getUser().getId();
            if (userId.equals(event.creatorUserId()) || !notifiedUsers.add(userId)) {
                continue;
            }
            notificationService.create(
                    userId,
                    event.organizationId(),
                    NotificationType.COMPLAINT_CREATED,
                    "New complaint filed",
                    "A new complaint was filed: %s".formatted(event.title()),
                    payload("organizationId", event.organizationId(), "complaintId", event.complaintId())
            );
        }
    }

    @EventListener
    public void onComplaintAssigned(ComplaintAssignedEvent event) {
        notificationService.create(
                event.assigneeUserId(),
                event.organizationId(),
                NotificationType.COMPLAINT_ASSIGNED,
                "Complaint assigned to you",
                "You have been assigned complaint: %s".formatted(event.title()),
                payload("organizationId", event.organizationId(), "complaintId", event.complaintId())
        );
    }

    @EventListener
    public void onComplaintResolved(ComplaintResolvedEvent event) {
        notificationService.create(
                event.creatorUserId(),
                event.organizationId(),
                NotificationType.COMPLAINT_RESOLVED,
                "Complaint resolved",
                "Your complaint '%s' has been resolved.".formatted(event.title()),
                payload("organizationId", event.organizationId(), "complaintId", event.complaintId())
        );
    }

    @EventListener
    public void onComplaintReopened(ComplaintReopenedEvent event) {
        notificationService.create(
                event.creatorUserId(),
                event.organizationId(),
                NotificationType.COMPLAINT_REOPENED,
                "Complaint reopened",
                "Your complaint '%s' has been reopened.".formatted(event.title()),
                payload("organizationId", event.organizationId(), "complaintId", event.complaintId())
        );

        if (event.assigneeUserId() != null && !event.assigneeUserId().equals(event.creatorUserId())) {
            notificationService.create(
                    event.assigneeUserId(),
                    event.organizationId(),
                    NotificationType.COMPLAINT_REOPENED,
                    "Complaint reopened",
                    "Complaint '%s' has been reopened.".formatted(event.title()),
                    payload("organizationId", event.organizationId(), "complaintId", event.complaintId())
            );
        }
    }

    @EventListener
    public void onAnnouncementPublished(AnnouncementPublishedEvent event) {
        for (Membership resident : membershipRepository.findActiveResidentsByOrganizationId(event.organizationId())) {
            notificationService.create(
                    resident.getUser().getId(),
                    event.organizationId(),
                    NotificationType.ANNOUNCEMENT_PUBLISHED,
                    "New announcement",
                    event.title(),
                    payload(
                            "organizationId", event.organizationId(),
                            "announcementId", event.announcementId()
                    )
            );
        }
        notificationDeliveryService.broadcastAnnouncement(event);
    }

    @EventListener
    public void onOccupancyAllocated(OccupancyAllocatedEvent event) {
        notificationService.create(
                event.userId(),
                event.organizationId(),
                NotificationType.OCCUPANCY_ALLOCATED,
                "Allocation confirmed",
                "Your accommodation allocation is now active.",
                payload(
                        "organizationId", event.organizationId(),
                        "occupancyId", event.occupancyId(),
                        "membershipId", event.membershipId()
                )
        );
    }

    @EventListener
    public void onOccupancyTransferred(OccupancyTransferredEvent event) {
        notificationService.create(
                event.userId(),
                event.organizationId(),
                NotificationType.OCCUPANCY_TRANSFERRED,
                "Allocation transferred",
                "Your accommodation allocation has been transferred.",
                payload(
                        "organizationId", event.organizationId(),
                        "membershipId", event.membershipId(),
                        "newOccupancyId", event.newOccupancyId()
                )
        );
    }

    @EventListener
    public void onReviewReported(ReviewReportedEvent event) {
        Set<UUID> notifiedOwners = new LinkedHashSet<>();
        for (Membership owner : membershipRepository.findActiveOwnersByOrganizationId(event.organizationId())) {
            UUID ownerUserId = owner.getUser().getId();
            if (!notifiedOwners.add(ownerUserId)) {
                continue;
            }
            notificationService.create(
                    ownerUserId,
                    event.organizationId(),
                    NotificationType.REVIEW_REPORTED,
                    "Review reported",
                    "A review has been reported and needs moderation.",
                    payload(
                            "organizationId", event.organizationId(),
                            "reviewId", event.reviewId(),
                            "reportedByUserId", event.reporterUserId()
                    )
            );
        }
    }

    private static Map<String, Object> payload(Object... keyValues) {
        Map<String, Object> payload = new HashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            Object value = keyValues[i + 1];
            if (value != null) {
                payload.put((String) keyValues[i], value);
            }
        }
        return payload;
    }
}
