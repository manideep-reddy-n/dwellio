package com.dwellio.mealfeedback.dto;

import com.dwellio.domain.enums.MealType;
import java.math.BigDecimal;
import java.time.LocalDate;

public record MealRatingRankItem(
        MealType mealType,
        LocalDate feedbackDate,
        BigDecimal avgRating,
        int ratingCount
) {
}
