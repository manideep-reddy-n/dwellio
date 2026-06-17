package com.dwellio.mealfeedback.dto;

import com.dwellio.domain.entity.MealFeedback;
import com.dwellio.domain.enums.MealType;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MealFeedbackResponse(
        UUID id,
        UUID organizationId,
        UUID membershipId,
        LocalDate feedbackDate,
        MealType mealType,
        short rating,
        String comment,
        Instant createdAt,
        Instant updatedAt
) {
    public static MealFeedbackResponse from(MealFeedback feedback) {
        return new MealFeedbackResponse(
                feedback.getId(),
                feedback.getOrganization().getId(),
                feedback.getMembership().getId(),
                feedback.getFeedbackDate(),
                feedback.getMealType(),
                feedback.getRating(),
                feedback.getComment(),
                feedback.getCreatedAt(),
                feedback.getUpdatedAt()
        );
    }
}
