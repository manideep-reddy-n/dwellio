package com.dwellio.admin.service;

import com.dwellio.admin.dto.AdminPagedResponse;
import com.dwellio.admin.dto.AdminReviewSummary;
import com.dwellio.audit.service.PlatformAuditService;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.domain.entity.Review;
import com.dwellio.review.repository.ReviewRepository;
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
public class AdminReviewService {

    private final ReviewRepository reviewRepository;
    private final AuthorizationService authorizationService;
    private final PlatformAuditService auditService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public AdminPagedResponse<AdminReviewSummary> list(String query, boolean includeHidden, int page, int size) {
        authorizationService.requirePlatformAdmin();
        Page<Review> reviews = reviewRepository.searchForAdmin(
                normalize(query),
                includeHidden,
                PageRequest.of(page, size)
        );
        return AdminPagedResponse.of(
                reviews.map(this::toSummary).getContent(),
                page,
                size,
                reviews.getTotalElements()
        );
    }

    @Transactional
    public AdminReviewSummary hide(UUID reviewId) {
        return moderate(reviewId, true, "REVIEW_HIDDEN");
    }

    @Transactional
    public AdminReviewSummary remove(UUID reviewId) {
        return moderate(reviewId, true, "REVIEW_REMOVED");
    }

    @Transactional
    public AdminReviewSummary restore(UUID reviewId) {
        return moderate(reviewId, false, "REVIEW_RESTORED");
    }

    private AdminReviewSummary moderate(UUID reviewId, boolean hide, String action) {
        authorizationService.requirePlatformAdmin();
        Review review = reviewRepository.findByIdForAdmin(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found"));
        boolean wasHidden = review.getDeletedAt() != null;

        if (hide) {
            review.setDeletedAt(Instant.now(clock));
        } else {
            review.setDeletedAt(null);
        }
        Review saved = reviewRepository.save(review);

        auditService.recordForCurrentUser(
                action,
                "REVIEW",
                reviewId,
                review.getOrganization().getId(),
                wasHidden ? "hidden" : "visible",
                hide ? "hidden" : "visible"
        );
        return toSummary(saved);
    }

    private AdminReviewSummary toSummary(Review review) {
        return new AdminReviewSummary(
                review.getId(),
                review.getOrganization().getId(),
                review.getOrganization().getName(),
                review.getMembership().getUser().getFullName(),
                review.getRating(),
                review.getBody(),
                review.getDeletedAt() != null,
                review.getCreatedAt()
        );
    }

    private static String normalize(String query) {
        return query == null || query.isBlank() ? null : query.trim();
    }
}
