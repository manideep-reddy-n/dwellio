package com.dwellio.activity.service;

import com.dwellio.activity.ActivityEventTypes;
import com.dwellio.activity.repository.ActivityEventRepository;
import com.dwellio.complaint.repository.ComplaintRepository;
import com.dwellio.domain.entity.Complaint;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Occupancy;
import com.dwellio.domain.entity.Payment;
import com.dwellio.domain.entity.Review;
import com.dwellio.domain.enums.ActivityEventCategory;
import com.dwellio.domain.enums.ComplaintStatus;
import com.dwellio.domain.enums.LedgerEntryType;
import com.dwellio.domain.enums.MembershipStatus;
import com.dwellio.domain.enums.PaymentStatus;
import com.dwellio.ledger.repository.FinancialLedgerEntryRepository;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.occupancy.repository.OccupancyRepository;
import com.dwellio.payment.repository.PaymentRepository;
import com.dwellio.review.repository.ReviewRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityEventBackfillService {

    private static final String SOURCE_MEMBERSHIP = "MEMBERSHIP";
    private static final String SOURCE_OCCUPANCY = "OCCUPANCY";
    private static final String SOURCE_PAYMENT = "PAYMENT";
    private static final String SOURCE_COMPLAINT = "COMPLAINT";
    private static final String SOURCE_REVIEW = "REVIEW";

    private final ActivityEventRepository activityEventRepository;
    private final ActivityEventRecorder activityEventRecorder;
    private final MembershipRepository membershipRepository;
    private final OccupancyRepository occupancyRepository;
    private final PaymentRepository paymentRepository;
    private final ComplaintRepository complaintRepository;
    private final ReviewRepository reviewRepository;
    private final FinancialLedgerEntryRepository ledgerEntryRepository;

    @Transactional
    public int backfillOrganization(UUID organizationId) {
        activityEventRepository.deleteByOrganizationId(organizationId);

        int count = 0;
        count += backfillMemberships(organizationId);
        count += backfillOccupancies(organizationId);
        count += backfillPayments(organizationId);
        count += backfillComplaints(organizationId);
        count += backfillReviews(organizationId);

        log.info("Backfilled {} activity events for organization {}", count, organizationId);
        return count;
    }

    private int backfillMemberships(UUID organizationId) {
        int count = 0;
        for (Membership membership : membershipRepository.findAllByOrganizationId(organizationId)) {
            Instant joinedAt = membership.getJoinedAt() != null ? membership.getJoinedAt() : membership.getCreatedAt();
            activityEventRecorder.record(
                    organizationId,
                    membership.getId(),
                    ActivityEventCategory.MEMBERSHIP,
                    ActivityEventTypes.MEMBERSHIP_JOINED,
                    "Joined organization",
                    membership.getUser().getFullName() + " became a member",
                    Map.of("membershipId", membership.getId().toString(), "status", membership.getStatus().name()),
                    joinedAt,
                    SOURCE_MEMBERSHIP,
                    membership.getId()
            );
            count++;

            if (membership.getStatus() == MembershipStatus.LEFT && membership.getLeftAt() != null) {
                activityEventRecorder.record(
                        organizationId,
                        membership.getId(),
                        ActivityEventCategory.MEMBERSHIP,
                        ActivityEventTypes.MEMBERSHIP_LEFT,
                        "Left organization",
                        membership.getExitReason() != null ? membership.getExitReason() : "Membership ended",
                        Map.of("membershipId", membership.getId().toString()),
                        membership.getLeftAt(),
                        SOURCE_MEMBERSHIP,
                        UUID.nameUUIDFromBytes((membership.getId().toString() + ":LEFT").getBytes())
                );
                count++;
            }
        }
        return count;
    }

    private int backfillOccupancies(UUID organizationId) {
        int count = 0;
        List<Occupancy> occupancies = occupancyRepository.findAllByOrganizationId(organizationId);
        for (Occupancy occupancy : occupancies) {
            Instant moveIn = toInstant(occupancy.getMoveInDate());
            String location = locationLabel(occupancy);
            activityEventRecorder.record(
                    organizationId,
                    occupancy.getMembership().getId(),
                    ActivityEventCategory.ACCOMMODATION,
                    ActivityEventTypes.OCCUPANCY_ALLOCATED,
                    "Occupancy allocated",
                    location,
                    occupancyMetadata(occupancy),
                    moveIn,
                    SOURCE_OCCUPANCY,
                    UUID.nameUUIDFromBytes((occupancy.getId().toString() + ":ALLOCATED").getBytes())
            );
            count++;

            if (!occupancy.isCurrent() && occupancy.getMoveOutDate() != null) {
                activityEventRecorder.record(
                        organizationId,
                        occupancy.getMembership().getId(),
                        ActivityEventCategory.ACCOMMODATION,
                        ActivityEventTypes.OCCUPANCY_RELEASED,
                        "Occupancy released",
                        location,
                        occupancyMetadata(occupancy),
                        toInstant(occupancy.getMoveOutDate()),
                        SOURCE_OCCUPANCY,
                        UUID.nameUUIDFromBytes((occupancy.getId().toString() + ":RELEASED").getBytes())
                );
                count++;
            }
        }
        return count;
    }

    private int backfillPayments(UUID organizationId) {
        int count = 0;
        for (Payment payment : paymentRepository.findAllActiveByOrganizationId(organizationId)) {
            UUID membershipId = payment.getMembership().getId();
            activityEventRecorder.record(
                    organizationId,
                    membershipId,
                    ActivityEventCategory.BILLING,
                    ActivityEventTypes.CHARGE_GENERATED,
                    "Charge generated",
                    chargeDescription(payment),
                    paymentMetadata(payment),
                    payment.getCreatedAt(),
                    SOURCE_PAYMENT,
                    UUID.nameUUIDFromBytes((payment.getId().toString() + ":CHARGE").getBytes())
            );
            count++;

            if (payment.getAmountPaid() != null && payment.getAmountPaid().signum() > 0) {
                Instant paidAt = payment.getPaidAt() != null ? payment.getPaidAt() : payment.getUpdatedAt();
                activityEventRecorder.record(
                        organizationId,
                        membershipId,
                        ActivityEventCategory.BILLING,
                        ActivityEventTypes.PAYMENT_RECEIVED,
                        "Payment received",
                        "₹" + payment.getAmountPaid() + " recorded",
                        paymentMetadata(payment),
                        paidAt,
                        SOURCE_PAYMENT,
                        UUID.nameUUIDFromBytes((payment.getId().toString() + ":PAYMENT").getBytes())
                );
                count++;
            }

            if (payment.getStatus() == PaymentStatus.OVERDUE) {
                activityEventRecorder.record(
                        organizationId,
                        membershipId,
                        ActivityEventCategory.BILLING,
                        ActivityEventTypes.LATE_FEE_APPLIED,
                        "Payment overdue",
                        chargeDescription(payment) + " is overdue",
                        paymentMetadata(payment),
                        toInstant(payment.getDueDate()),
                        SOURCE_PAYMENT,
                        UUID.nameUUIDFromBytes((payment.getId().toString() + ":OVERDUE").getBytes())
                );
                count++;
            }
        }

        count += (int) ledgerEntryRepository.findByOrganization(organizationId).stream()
                .filter(entry -> entry.getEntryType() == LedgerEntryType.ADJUSTMENT)
                .peek(entry -> activityEventRecorder.record(
                        organizationId,
                        entry.getMembership().getId(),
                        ActivityEventCategory.BILLING,
                        ActivityEventTypes.ADJUSTMENT_APPLIED,
                        "Adjustment applied",
                        entry.getDescription(),
                        Map.of("ledgerEntryId", entry.getId().toString()),
                        entry.getCreatedAt(),
                        "LEDGER",
                        entry.getId()
                ))
                .count();

        return count;
    }

    private int backfillComplaints(UUID organizationId) {
        int count = 0;
        for (Complaint complaint : complaintRepository.findAllActiveByOrganizationId(organizationId, null)) {
            UUID membershipId = complaint.getCreatedByMembership().getId();
            activityEventRecorder.record(
                    organizationId,
                    membershipId,
                    ActivityEventCategory.COMPLAINT,
                    ActivityEventTypes.COMPLAINT_CREATED,
                    "Complaint created",
                    complaint.getTitle(),
                    Map.of("complaintId", complaint.getId().toString(), "category", complaint.getCategory().name()),
                    complaint.getCreatedAt(),
                    SOURCE_COMPLAINT,
                    UUID.nameUUIDFromBytes((complaint.getId().toString() + ":CREATED").getBytes())
            );
            count++;

            if (complaint.getAssignedAt() != null) {
                activityEventRecorder.record(
                        organizationId,
                        membershipId,
                        ActivityEventCategory.COMPLAINT,
                        ActivityEventTypes.COMPLAINT_ASSIGNED,
                        "Complaint assigned",
                        complaint.getTitle(),
                        Map.of("complaintId", complaint.getId().toString()),
                        complaint.getAssignedAt(),
                        SOURCE_COMPLAINT,
                        UUID.nameUUIDFromBytes((complaint.getId().toString() + ":ASSIGNED").getBytes())
                );
                count++;
            }

            if (complaint.getResolvedAt() != null) {
                activityEventRecorder.record(
                        organizationId,
                        membershipId,
                        ActivityEventCategory.COMPLAINT,
                        ActivityEventTypes.COMPLAINT_RESOLVED,
                        "Complaint resolved",
                        complaint.getTitle(),
                        Map.of("complaintId", complaint.getId().toString()),
                        complaint.getResolvedAt(),
                        SOURCE_COMPLAINT,
                        UUID.nameUUIDFromBytes((complaint.getId().toString() + ":RESOLVED").getBytes())
                );
                count++;
            }

            if (complaint.getClosedAt() != null) {
                activityEventRecorder.record(
                        organizationId,
                        membershipId,
                        ActivityEventCategory.COMPLAINT,
                        ActivityEventTypes.COMPLAINT_CLOSED,
                        "Complaint closed",
                        complaint.getTitle(),
                        Map.of("complaintId", complaint.getId().toString()),
                        complaint.getClosedAt(),
                        SOURCE_COMPLAINT,
                        UUID.nameUUIDFromBytes((complaint.getId().toString() + ":CLOSED").getBytes())
                );
                count++;
            }

            if (complaint.getStatus() == ComplaintStatus.REOPENED) {
                activityEventRecorder.record(
                        organizationId,
                        membershipId,
                        ActivityEventCategory.COMPLAINT,
                        ActivityEventTypes.COMPLAINT_REOPENED,
                        "Complaint reopened",
                        complaint.getTitle(),
                        Map.of("complaintId", complaint.getId().toString()),
                        complaint.getUpdatedAt(),
                        SOURCE_COMPLAINT,
                        UUID.nameUUIDFromBytes((complaint.getId().toString() + ":REOPENED").getBytes())
                );
                count++;
            }
        }
        return count;
    }

    private int backfillReviews(UUID organizationId) {
        int count = 0;
        for (Review review : reviewRepository.findAllActiveByOrganizationId(organizationId)) {
            activityEventRecorder.record(
                    organizationId,
                    review.getMembership().getId(),
                    ActivityEventCategory.REVIEW,
                    ActivityEventTypes.REVIEW_SUBMITTED,
                    "Review submitted",
                    review.getRating() + " star review",
                    Map.of("reviewId", review.getId().toString(), "rating", review.getRating()),
                    review.getCreatedAt(),
                    SOURCE_REVIEW,
                    UUID.nameUUIDFromBytes((review.getId().toString() + ":SUBMITTED").getBytes())
            );
            count++;

            if (review.getUpdatedAt() != null && review.getUpdatedAt().isAfter(review.getCreatedAt())) {
                activityEventRecorder.record(
                        organizationId,
                        review.getMembership().getId(),
                        ActivityEventCategory.REVIEW,
                        ActivityEventTypes.REVIEW_UPDATED,
                        "Review updated",
                        review.getRating() + " star review",
                        Map.of("reviewId", review.getId().toString(), "rating", review.getRating()),
                        review.getUpdatedAt(),
                        SOURCE_REVIEW,
                        UUID.nameUUIDFromBytes((review.getId().toString() + ":UPDATED").getBytes())
                );
                count++;
            }
        }
        return count;
    }

    private static Map<String, Object> occupancyMetadata(Occupancy occupancy) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("occupancyId", occupancy.getId().toString());
        if (occupancy.getBed() != null) {
            metadata.put("bedId", occupancy.getBed().getId().toString());
            metadata.put("bedLabel", occupancy.getBed().getBedLabel());
        }
        if (occupancy.getUnitSpace() != null) {
            metadata.put("unitSpaceId", occupancy.getUnitSpace().getId().toString());
            metadata.put("unitIdentifier", occupancy.getUnitSpace().getIdentifier());
        }
        return metadata;
    }

    private static Map<String, Object> paymentMetadata(Payment payment) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("paymentId", payment.getId().toString());
        metadata.put("amount", payment.getAmount());
        metadata.put("amountPaid", payment.getAmountPaid());
        metadata.put("status", payment.getStatus().name());
        return metadata;
    }

    private static String chargeDescription(Payment payment) {
        if (payment.getDescription() != null && !payment.getDescription().isBlank()) {
            return payment.getDescription();
        }
        return payment.getChargeType().name() + " — ₹" + payment.getAmount();
    }

    private static String locationLabel(Occupancy occupancy) {
        if (occupancy.getBed() != null) {
            return occupancy.getBed().getBedLabel();
        }
        if (occupancy.getUnitSpace() != null) {
            return occupancy.getUnitSpace().getIdentifier();
        }
        return "—";
    }

    private static Instant toInstant(LocalDate date) {
        return date.atStartOfDay(ZoneId.systemDefault()).toInstant();
    }
}
