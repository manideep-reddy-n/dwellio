package com.dwellio.metrics.projection.snapshot;

import java.math.BigDecimal;

public record OccupancyLifecycleSnapshot(
        int moveInsMonth,
        int moveOutsMonth,
        BigDecimal avgStayDays,
        BigDecimal turnoverRate
) {
}
