package com.dwellio.resident.dto;

import com.dwellio.ledger.dto.LedgerEntryResponse;
import com.dwellio.occupancy.dto.OccupancyResponse;
import com.dwellio.payment.dto.PaymentResponse;
import com.dwellio.review.dto.ReviewResponse;
import java.util.List;

public record ResidentLifecycleProfileResponse(
        ResidentLifecycleMembershipInfo membership,
        OccupancyResponse currentOccupancy,
        List<OccupancyResponse> accommodationHistory,
        ResidentFinancialSummary financialSummary,
        List<PaymentResponse> payments,
        List<LedgerEntryResponse> ledgerEntries,
        List<ResidentComplaintSummary> complaints,
        ResidentComplaintMetrics complaintMetrics,
        List<ReviewResponse> reviews
) {
}
