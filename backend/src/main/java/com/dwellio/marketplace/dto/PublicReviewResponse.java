package com.dwellio.marketplace.dto;

import com.dwellio.domain.entity.Review;
import java.time.Instant;
import java.util.UUID;

public record PublicReviewResponse(
        UUID id,
        String residentName,
        short rating,
        String body,
        Instant createdAt
) {
    public static PublicReviewResponse from(Review review) {
        return new PublicReviewResponse(
                review.getId(),
                review.getMembership().getUser().getFullName(),
                review.getRating(),
                review.getBody(),
                review.getCreatedAt()
        );
    }
}
