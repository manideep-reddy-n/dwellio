package com.dwellio.review.dto;

import com.dwellio.domain.entity.Review;
import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
        UUID id,
        UUID organizationId,
        UUID membershipId,
        String residentName,
        short rating,
        String body,
        Instant createdAt,
        Instant updatedAt
) {
    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getOrganization().getId(),
                review.getMembership().getId(),
                review.getMembership().getUser().getFullName(),
                review.getRating(),
                review.getBody(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}
