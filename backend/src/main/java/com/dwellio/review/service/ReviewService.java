package com.dwellio.review.service;

import com.dwellio.auth.repository.UserRepository;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ConflictException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.common.security.MembershipContext;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Review;
import com.dwellio.domain.entity.ReviewReport;
import com.dwellio.activity.ActivityEventTypes;
import com.dwellio.activity.service.ActivityEventRecorder;
import com.dwellio.domain.enums.ActivityEventCategory;
import com.dwellio.domain.entity.User;
import com.dwellio.domain.enums.ReviewReportStatus;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.operations.service.OperationsGuard;
import com.dwellio.review.dto.CreateReviewRequest;
import com.dwellio.review.dto.ReportReviewRequest;
import com.dwellio.review.dto.ReviewResponse;
import com.dwellio.review.dto.UpdateReviewRequest;
import com.dwellio.common.event.AfterCommitEventPublisher;
import com.dwellio.review.event.ReviewEventPublisher;
import com.dwellio.review.event.ReviewReportedEvent;
import com.dwellio.review.repository.ReviewReportRepository;
import com.dwellio.review.repository.ReviewRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final String SOURCE_REVIEW = "REVIEW";

    private static final int MIN_MEMBERSHIP_DAYS = 7;

    private final ReviewRepository reviewRepository;
    private final ReviewReportRepository reviewReportRepository;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final OperationsGuard operationsGuard;
    private final AuthorizationService authorizationService;
    private final ReviewEventPublisher eventPublisher;
    private final AfterCommitEventPublisher afterCommitEventPublisher;
    private final ActivityEventRecorder activityEventRecorder;
    private final Clock clock;

    @Transactional
    public ReviewResponse create(UUID organizationId, CreateReviewRequest request) {
        MembershipContext context = authorizationService.requirePermission(organizationId, "review:create");
        Organization organization = operationsGuard.requireOrganization(organizationId);
        Membership membership = getMembership(organizationId, context.getMembershipId());
        ensureEligibleForReview(membership);

        if (reviewRepository.existsByMembershipIdAndDeletedAtIsNull(membership.getId())) {
            throw new ConflictException("You have already submitted a review for this organization");
        }

        Review review = new Review();
        review.setId(UUID.randomUUID());
        review.setOrganization(organization);
        review.setMembership(membership);
        review.setRating(request.rating());
        review.setBody(normalizeBody(request.body()));
        review = reviewRepository.save(review);

        recordReviewEvent(
                organizationId,
                membership.getId(),
                review,
                ActivityEventTypes.REVIEW_SUBMITTED,
                "Review submitted",
                review.getCreatedAt(),
                "SUBMITTED"
        );
        publishMetrics(organizationId);
        return ReviewResponse.from(review);
    }

    @Transactional
    public ReviewResponse updateMine(UUID organizationId, UpdateReviewRequest request) {
        MembershipContext context = authorizationService.requirePermission(organizationId, "review:update_own");
        Review review = reviewRepository.findActiveByOrganizationIdAndMembershipId(
                        organizationId,
                        context.getMembershipId()
                )
                .orElseThrow(() -> new NotFoundException("Review not found"));

        review.setRating(request.rating());
        review.setBody(normalizeBody(request.body()));
        review = reviewRepository.save(review);

        recordReviewEvent(
                organizationId,
                review.getMembership().getId(),
                review,
                ActivityEventTypes.REVIEW_UPDATED,
                "Review updated",
                review.getUpdatedAt(),
                "UPDATED"
        );
        publishMetrics(organizationId);
        return ReviewResponse.from(review);
    }

    @Transactional(readOnly = true)
    public ReviewResponse getMine(UUID organizationId) {
        MembershipContext context = authorizationService.requirePermission(organizationId, "review:update_own");
        Review review = reviewRepository.findActiveByOrganizationIdAndMembershipId(
                        organizationId,
                        context.getMembershipId()
                )
                .orElseThrow(() -> new NotFoundException("Review not found"));
        return ReviewResponse.from(review);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> list(UUID organizationId) {
        authorizationService.requirePermission(organizationId, "review:read");
        operationsGuard.requireOrganization(organizationId);
        return reviewRepository.findAllActiveByOrganizationId(organizationId).stream()
                .map(ReviewResponse::from)
                .toList();
    }

    @Transactional
    public void report(UUID organizationId, UUID reviewId, ReportReviewRequest request) {
        authorizationService.requireMembership(organizationId);
        Review review = reviewRepository.findActiveByIdAndOrganizationId(reviewId, organizationId)
                .orElseThrow(() -> new NotFoundException("Review not found"));

        User reporter = userRepository.findActiveById(authorizationService.currentPrincipal().getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        ReviewReport report = new ReviewReport();
        report.setId(UUID.randomUUID());
        report.setReview(review);
        report.setReportedBy(reporter);
        report.setReason(request.reason().trim());
        report.setStatus(ReviewReportStatus.PENDING);
        reviewReportRepository.save(report);
        afterCommitEventPublisher.publish(new ReviewReportedEvent(
                organizationId,
                reviewId,
                reporter.getId()
        ));
    }

    private void ensureEligibleForReview(Membership membership) {
        Instant membershipStart = membership.getJoinedAt() != null
                ? membership.getJoinedAt()
                : membership.getCreatedAt();
        Instant eligibleAt = membershipStart.plus(MIN_MEMBERSHIP_DAYS, ChronoUnit.DAYS);
        if (Instant.now(clock).isBefore(eligibleAt)) {
            throw new BadRequestException(
                    "You must be an active member for at least %d days before submitting a review"
                            .formatted(MIN_MEMBERSHIP_DAYS)
            );
        }
    }

    private Membership getMembership(UUID organizationId, UUID membershipId) {
        return membershipRepository.findActiveByIdAndOrganizationId(membershipId, organizationId)
                .orElseThrow(() -> new NotFoundException("Membership not found"));
    }

    private String normalizeBody(String body) {
        if (body == null) {
            return null;
        }
        String trimmed = body.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void publishMetrics(UUID organizationId) {
        eventPublisher.publishMetricsChanged(organizationId);
    }

    private void recordReviewEvent(
            UUID organizationId,
            UUID membershipId,
            Review review,
            String eventType,
            String title,
            Instant occurredAt,
            String sourceSuffix
    ) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("reviewId", review.getId().toString());
        metadata.put("rating", review.getRating());
        activityEventRecorder.record(
                organizationId,
                membershipId,
                ActivityEventCategory.REVIEW,
                eventType,
                title,
                review.getRating() + " star review",
                metadata,
                occurredAt,
                SOURCE_REVIEW,
                reviewSourceId(review.getId(), sourceSuffix)
        );
    }

    private static UUID reviewSourceId(UUID reviewId, String suffix) {
        return UUID.nameUUIDFromBytes((reviewId.toString() + ":" + suffix).getBytes());
    }
}
