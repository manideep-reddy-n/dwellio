package com.dwellio.notification.event;

import com.dwellio.accommodation.event.OccupancyAllocatedEvent;
import com.dwellio.accommodation.event.OccupancyTransferredEvent;
import com.dwellio.complaint.event.ComplaintAssignedEvent;
import com.dwellio.complaint.event.ComplaintCreatedEvent;
import com.dwellio.complaint.event.ComplaintReopenedEvent;
import com.dwellio.complaint.event.ComplaintResolvedEvent;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.enums.NotificationType;
import com.dwellio.joinrequest.event.JoinRequestRejectedEvent;
import com.dwellio.joinrequest.event.JoinRequestSubmittedEvent;
import com.dwellio.leaverequest.event.LeaveRequestSubmittedEvent;
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
        organizationRepository.findActiveById(event.organizationId()).ifPresent(org -> {
            notificationService.create(
                    event.userId(),
                    event.organizationId(),
                    NotificationType.JOIN_REQUEST_APPROVED,
                    "Join request approved",
                    "Your request to join %s has been approved.".formatted(org.getName()),
                    orgPayload(org,
                            "membershipId", event.membershipId(),
                            "targetPath", residentHome(org.getSlug())
                    )
            );
        });
    }

    @EventListener
    public void onLeaveRequestSubmitted(LeaveRequestSubmittedEvent event) {
        Set<UUID> notifiedUsers = new LinkedHashSet<>();
        for (Membership owner : membershipRepository.findActiveOwnersByOrganizationId(event.organizationId())) {
            UUID userId = owner.getUser().getId();
            if (userId.equals(event.residentUserId()) || !notifiedUsers.add(userId)) {
                continue;
            }
            notificationService.create(
                    userId,
                    event.organizationId(),
                    NotificationType.LEAVE_REQUEST_SUBMITTED,
                    "Resident wants to leave",
                    "%s requested to leave %s.".formatted(event.residentName(), event.organizationName()),
                    payload(
                            "organizationId", event.organizationId(),
                            "organizationSlug", event.organizationSlug(),
                            "leaveRequestId", event.leaveRequestId(),
                            "residentUserId", event.residentUserId(),
                            "targetPath", opsResidents(event.organizationSlug())
                    )
            );
        }
    }

    @EventListener
    public void onJoinRequestSubmitted(JoinRequestSubmittedEvent event) {
        Set<UUID> notifiedUsers = new LinkedHashSet<>();
        for (Membership approver : membershipRepository.findActiveJoinApproversByOrganizationId(event.organizationId())) {
            UUID userId = approver.getUser().getId();
            if (userId.equals(event.applicantUserId()) || !notifiedUsers.add(userId)) {
                continue;
            }
            notificationService.create(
                    userId,
                    event.organizationId(),
                    NotificationType.JOIN_REQUEST_SUBMITTED,
                    "New join request",
                    "%s requested to join %s.".formatted(event.applicantName(), event.organizationName()),
                    payload(
                            "organizationId", event.organizationId(),
                            "organizationSlug", event.organizationSlug(),
                            "joinRequestId", event.joinRequestId(),
                            "applicantUserId", event.applicantUserId(),
                            "targetPath", opsJoinRequests(event.organizationSlug())
                    )
            );
        }
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
                        "organizationSlug", event.organizationSlug(),
                        "joinRequestId", event.joinRequestId(),
                        "rejectionReason", event.rejectionReason(),
                        "targetPath", "/" + event.organizationSlug()
                )
        );
    }

    @EventListener
    public void onComplaintCreated(ComplaintCreatedEvent event) {
        organizationRepository.findActiveById(event.organizationId()).ifPresent(org -> {
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
                        orgPayload(org,
                                "complaintId", event.complaintId(),
                                "targetPath", opsComplaints(org.getSlug())
                        )
                );
            }
        });
    }

    @EventListener
    public void onComplaintAssigned(ComplaintAssignedEvent event) {
        organizationRepository.findActiveById(event.organizationId()).ifPresent(org ->
                notificationService.create(
                        event.assigneeUserId(),
                        event.organizationId(),
                        NotificationType.COMPLAINT_ASSIGNED,
                        "Complaint assigned to you",
                        "You have been assigned complaint: %s".formatted(event.title()),
                        orgPayload(org,
                                "complaintId", event.complaintId(),
                                "targetPath", opsComplaints(org.getSlug())
                        )
                )
        );
    }

    @EventListener
    public void onComplaintResolved(ComplaintResolvedEvent event) {
        organizationRepository.findActiveById(event.organizationId()).ifPresent(org ->
                notificationService.create(
                        event.creatorUserId(),
                        event.organizationId(),
                        NotificationType.COMPLAINT_RESOLVED,
                        "Complaint resolved",
                        "Your complaint '%s' has been resolved.".formatted(event.title()),
                        orgPayload(org,
                                "complaintId", event.complaintId(),
                                "targetPath", residentComplaints(org.getSlug())
                        )
                )
        );
    }

    @EventListener
    public void onComplaintReopened(ComplaintReopenedEvent event) {
        organizationRepository.findActiveById(event.organizationId()).ifPresent(org -> {
            notificationService.create(
                    event.creatorUserId(),
                    event.organizationId(),
                    NotificationType.COMPLAINT_REOPENED,
                    "Complaint reopened",
                    "Your complaint '%s' has been reopened.".formatted(event.title()),
                    orgPayload(org,
                            "complaintId", event.complaintId(),
                            "targetPath", residentComplaints(org.getSlug())
                    )
            );

            if (event.assigneeUserId() != null && !event.assigneeUserId().equals(event.creatorUserId())) {
                notificationService.create(
                        event.assigneeUserId(),
                        event.organizationId(),
                        NotificationType.COMPLAINT_REOPENED,
                        "Complaint reopened",
                        "Complaint '%s' has been reopened.".formatted(event.title()),
                        orgPayload(org,
                                "complaintId", event.complaintId(),
                                "targetPath", opsComplaints(org.getSlug())
                        )
                );
            }
        });
    }

    @EventListener
    public void onAnnouncementPublished(AnnouncementPublishedEvent event) {
        organizationRepository.findActiveById(event.organizationId()).ifPresent(org -> {
            for (Membership resident : membershipRepository.findActiveResidentsByOrganizationId(event.organizationId())) {
                notificationService.create(
                        resident.getUser().getId(),
                        event.organizationId(),
                        NotificationType.ANNOUNCEMENT_PUBLISHED,
                        "New announcement",
                        event.title(),
                        orgPayload(org,
                                "announcementId", event.announcementId(),
                                "targetPath", residentAnnouncements(org.getSlug())
                        )
                );
            }
            notificationDeliveryService.broadcastAnnouncement(event);
        });
    }

    @EventListener
    public void onOccupancyAllocated(OccupancyAllocatedEvent event) {
        organizationRepository.findActiveById(event.organizationId()).ifPresent(org ->
                notificationService.create(
                        event.userId(),
                        event.organizationId(),
                        NotificationType.OCCUPANCY_ALLOCATED,
                        "Allocation confirmed",
                        "Your accommodation allocation is now active.",
                        orgPayload(org,
                                "occupancyId", event.occupancyId(),
                                "membershipId", event.membershipId(),
                                "targetPath", residentAccommodation(org.getSlug())
                        )
                )
        );
    }

    @EventListener
    public void onOccupancyTransferred(OccupancyTransferredEvent event) {
        organizationRepository.findActiveById(event.organizationId()).ifPresent(org ->
                notificationService.create(
                        event.userId(),
                        event.organizationId(),
                        NotificationType.OCCUPANCY_TRANSFERRED,
                        "Allocation transferred",
                        "Your accommodation allocation has been transferred.",
                        orgPayload(org,
                                "membershipId", event.membershipId(),
                                "newOccupancyId", event.newOccupancyId(),
                                "targetPath", residentAccommodation(org.getSlug())
                        )
                )
        );
    }

    @EventListener
    public void onReviewReported(ReviewReportedEvent event) {
        organizationRepository.findActiveById(event.organizationId()).ifPresent(org -> {
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
                        orgPayload(org,
                                "reviewId", event.reviewId(),
                                "reportedByUserId", event.reporterUserId(),
                                "targetPath", opsReviews(org.getSlug())
                        )
                );
            }
        });
    }

    private static Map<String, Object> orgPayload(Organization org, Object... extras) {
        Map<String, Object> map = new HashMap<>();
        map.put("organizationId", org.getId().toString());
        map.put("organizationSlug", org.getSlug());
        for (int i = 0; i < extras.length; i += 2) {
            Object value = extras[i + 1];
            if (value != null) {
                map.put((String) extras[i], value instanceof UUID uuid ? uuid.toString() : value);
            }
        }
        return map;
    }

    private static String residentHome(String slug) {
        return "/app/" + slug + "/resident";
    }

    private static String residentComplaints(String slug) {
        return "/app/" + slug + "/resident/complaints";
    }

    private static String residentAnnouncements(String slug) {
        return "/app/" + slug + "/resident/announcements";
    }

    private static String residentAccommodation(String slug) {
        return "/app/" + slug + "/resident/accommodation";
    }

    private static String opsComplaints(String slug) {
        return "/app/" + slug + "/operations/complaints";
    }

    private static String opsJoinRequests(String slug) {
        return "/app/" + slug + "/operations/join-requests";
    }

    private static String opsResidents(String slug) {
        return "/app/" + slug + "/operations/residents";
    }

    private static String opsReviews(String slug) {
        return "/app/" + slug + "/operations/reviews";
    }

    private static Map<String, Object> payload(Object... keyValues) {
        Map<String, Object> payload = new HashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            Object value = keyValues[i + 1];
            if (value != null) {
                payload.put((String) keyValues[i], value instanceof UUID uuid ? uuid.toString() : value);
            }
        }
        return payload;
    }
}
