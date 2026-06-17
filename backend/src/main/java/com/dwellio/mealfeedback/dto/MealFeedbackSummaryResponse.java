package com.dwellio.mealfeedback.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record MealFeedbackSummaryResponse(
        BigDecimal avgBreakfastRating,
        BigDecimal avgLunchRating,
        BigDecimal avgDinnerRating,
        BigDecimal weeklyAvgRating,
        BigDecimal monthlyAvgRating,
        int totalFeedbackCount,
        List<Map<String, Object>> dailyTrend,
        List<MealRatingRankItem> bestRatedMeals,
        List<MealRatingRankItem> worstRatedMeals
) {
}
