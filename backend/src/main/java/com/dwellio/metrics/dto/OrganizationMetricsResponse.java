package com.dwellio.metrics.dto;

import com.dwellio.domain.entity.OrganizationMetricsCache;
import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.metrics.dto.ComplaintCategoryCount;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record OrganizationMetricsResponse(
        UUID organizationId,
        AccommodationMode accommodationMode,
        int activeResidentCount,
        BigDecimal avgRating,
        int reviewCount,
        BigDecimal avgResolutionDays,
        BigDecimal resolutionRate,
        int openComplaintCount,
        BigDecimal avgFirstResponseHours,
        List<ComplaintCategoryCount> complaintCategoryDistribution,
        BigDecimal satisfactionScore,
        BigDecimal searchRankScore,
        Integer totalRooms,
        Integer vacantRooms,
        Integer partialRooms,
        Integer occupiedRooms,
        Integer blockedRooms,
        Integer totalBeds,
        Integer availableBeds,
        Integer occupiedBeds,
        Integer blockedBeds,
        Integer totalUnits,
        Integer availableUnits,
        Integer occupiedUnits,
        Integer blockedUnits,
        BigDecimal occupancyRate,
        BigDecimal expectedRevenueMonth,
        BigDecimal collectedRevenueMonth,
        BigDecimal outstandingRevenueMonth,
        BigDecimal collectionRate,
        int defaultersCount,
        List<Map<String, Object>> revenueTrend,
        BigDecimal forecastRevenueNextMonth,
        int moveInsMonth,
        int moveOutsMonth,
        BigDecimal avgStayDays,
        BigDecimal turnoverRate,
        int pendingPaymentsCount,
        BigDecimal slaFirstResponseHours,
        BigDecimal slaResolutionHours,
        BigDecimal slaComplianceRate,
        int slaViolationsCount,
        int reopenedComplaintsCount,
        BigDecimal avgBreakfastRating,
        BigDecimal avgLunchRating,
        BigDecimal avgDinnerRating,
        List<Map<String, Object>> mealRatingsTrend,
        Instant refreshedAt
) {
    public static OrganizationMetricsResponse from(OrganizationMetricsCache cache) {
        return new OrganizationMetricsResponse(
                cache.getOrganizationId(),
                cache.getAccommodationMode(),
                cache.getActiveResidentCount(),
                cache.getAvgRating(),
                cache.getReviewCount(),
                cache.getAvgResolutionDays(),
                cache.getResolutionRate(),
                cache.getOpenComplaintCount(),
                cache.getAvgFirstResponseHours(),
                ComplaintCategoryCount.fromDistribution(cache.getComplaintCategoryCounts()),
                cache.getSatisfactionScore(),
                cache.getSearchRankScore(),
                cache.getTotalRooms(),
                cache.getVacantRooms(),
                cache.getPartialRooms(),
                cache.getOccupiedRooms(),
                cache.getBlockedRooms(),
                cache.getTotalBeds(),
                cache.getAvailableBeds(),
                cache.getOccupiedBeds(),
                cache.getBlockedBeds(),
                cache.getTotalUnits(),
                cache.getAvailableUnits(),
                cache.getOccupiedUnits(),
                cache.getBlockedUnits(),
                computeOccupancyRate(cache),
                cache.getExpectedRevenueMonth(),
                cache.getCollectedRevenueMonth(),
                cache.getOutstandingRevenueMonth(),
                cache.getCollectionRate(),
                cache.getDefaultersCount(),
                cache.getRevenueTrendJson(),
                cache.getForecastRevenueNextMonth(),
                cache.getMoveInsMonth(),
                cache.getMoveOutsMonth(),
                cache.getAvgStayDays(),
                cache.getTurnoverRate(),
                cache.getPendingPaymentsCount(),
                cache.getSlaFirstResponseHours(),
                cache.getSlaResolutionHours(),
                cache.getSlaComplianceRate(),
                cache.getSlaViolationsCount(),
                cache.getReopenedComplaintsCount(),
                cache.getAvgBreakfastRating(),
                cache.getAvgLunchRating(),
                cache.getAvgDinnerRating(),
                cache.getMealRatingsTrendJson(),
                cache.getRefreshedAt()
        );
    }

    private static BigDecimal computeOccupancyRate(OrganizationMetricsCache cache) {
        if (cache.getAccommodationMode() == AccommodationMode.BED_BASED) {
            Integer total = cache.getTotalBeds();
            Integer occupied = cache.getOccupiedBeds();
            if (total == null || total == 0 || occupied == null) {
                return null;
            }
            return BigDecimal.valueOf(occupied)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(total), 2, java.math.RoundingMode.HALF_UP);
        }

        Integer total = cache.getTotalUnits();
        Integer occupied = cache.getOccupiedUnits();
        if (total == null || total == 0 || occupied == null) {
            return null;
        }
        return BigDecimal.valueOf(occupied)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 2, java.math.RoundingMode.HALF_UP);
    }
}
