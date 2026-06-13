package com.dwellio.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateReviewRequest(
        @NotNull @Min(1) @Max(5) Short rating,
        String body
) {
}
