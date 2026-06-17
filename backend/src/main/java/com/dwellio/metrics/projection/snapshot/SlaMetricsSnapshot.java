package com.dwellio.metrics.projection.snapshot;

import java.math.BigDecimal;

public record SlaMetricsSnapshot(
        BigDecimal slaComplianceRate,
        int slaViolationsCount,
        int reopenedComplaintsCount
) {
}
