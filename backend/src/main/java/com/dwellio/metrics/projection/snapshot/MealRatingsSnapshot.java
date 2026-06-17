package com.dwellio.metrics.projection.snapshot;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record MealRatingsSnapshot(
        BigDecimal avgBreakfastRating,
        BigDecimal avgLunchRating,
        BigDecimal avgDinnerRating,
        List<Map<String, Object>> trend
) {
}
