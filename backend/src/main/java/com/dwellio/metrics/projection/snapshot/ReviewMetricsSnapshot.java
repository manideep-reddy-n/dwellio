package com.dwellio.metrics.projection.snapshot;

import java.math.BigDecimal;

public record ReviewMetricsSnapshot(
        BigDecimal avgRating,
        int reviewCount
) {
}
