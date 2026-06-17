package com.dwellio.complaint.dto;

import java.math.BigDecimal;
import java.util.List;

public record ComplaintSlaSummaryResponse(
        BigDecimal slaFirstResponseHours,
        BigDecimal slaResolutionHours,
        int totalComplaints,
        int violationsCount,
        BigDecimal slaComplianceRate,
        int reopenedComplaintsCount,
        List<ComplaintSlaBreachItemResponse> breachedComplaints
) {
}
