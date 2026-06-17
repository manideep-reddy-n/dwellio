package com.dwellio.resident.dto;

import java.math.BigDecimal;

public record ResidentComplaintMetrics(
        int totalComplaints,
        int openComplaints,
        int resolvedComplaints,
        BigDecimal avgFirstResponseHours,
        BigDecimal avgResolutionDays
) {
}
