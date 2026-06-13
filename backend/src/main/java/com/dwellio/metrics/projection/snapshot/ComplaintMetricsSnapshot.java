package com.dwellio.metrics.projection.snapshot;

import java.math.BigDecimal;

public record ComplaintMetricsSnapshot(
        int openComplaintCount,
        BigDecimal avgResolutionDays,
        BigDecimal resolutionRate,
        BigDecimal avgFirstResponseHours
) {
}
