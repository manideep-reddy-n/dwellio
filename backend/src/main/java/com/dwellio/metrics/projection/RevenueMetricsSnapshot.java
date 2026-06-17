package com.dwellio.metrics.projection;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record RevenueMetricsSnapshot(
        BigDecimal expectedRevenueMonth,
        BigDecimal collectedRevenueMonth,
        BigDecimal outstandingRevenueMonth,
        BigDecimal collectionRate,
        int defaultersCount,
        List<Map<String, Object>> revenueTrend,
        BigDecimal forecastRevenueNextMonth
) {
}
