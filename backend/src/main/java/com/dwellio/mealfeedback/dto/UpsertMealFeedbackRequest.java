package com.dwellio.mealfeedback.dto;

import com.dwellio.domain.enums.MealType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpsertMealFeedbackRequest(
        @NotNull MealType mealType,
        @NotNull @Min(1) @Max(5) Short rating,
        LocalDate feedbackDate,
        @Size(max = 2000) String comment
) {
}
