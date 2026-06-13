package com.dwellio.review.dto;

import jakarta.validation.constraints.NotBlank;

public record ReportReviewRequest(
        @NotBlank String reason
) {
}
