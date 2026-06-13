package com.dwellio.marketplace.dto;

import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.OrganizationMetricsCache;
import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.domain.enums.OrganizationType;
import java.math.BigDecimal;
import java.util.UUID;

public record PublicOrganizationSummaryResponse(
        UUID id,
        String slug,
        String name,
        String description,
        OrganizationType type,
        AccommodationMode accommodationMode,
        String city,
        String area,
        PublicOrganizationMetrics metrics
) {
    public static PublicOrganizationSummaryResponse from(
            Organization organization,
            OrganizationMetricsCache cache
    ) {
        return new PublicOrganizationSummaryResponse(
                organization.getId(),
                organization.getSlug(),
                organization.getName(),
                organization.getDescription(),
                organization.getType(),
                organization.getAccommodationMode(),
                organization.getCity(),
                organization.getArea(),
                PublicOrganizationMetrics.from(cache)
        );
    }

    public static PublicOrganizationSummaryResponse fromOrganization(Organization organization) {
        return new PublicOrganizationSummaryResponse(
                organization.getId(),
                organization.getSlug(),
                organization.getName(),
                organization.getDescription(),
                organization.getType(),
                organization.getAccommodationMode(),
                organization.getCity(),
                organization.getArea(),
                PublicOrganizationMetrics.empty()
        );
    }

    public record PublicOrganizationMetrics(
            int activeResidentCount,
            BigDecimal avgRating,
            int reviewCount,
            BigDecimal avgResolutionDays,
            BigDecimal resolutionRate,
            int openComplaintCount,
            BigDecimal avgFirstResponseHours,
            Integer availableBeds,
            Integer availableUnits,
            Integer totalBeds,
            Integer totalUnits,
            BigDecimal searchRankScore
    ) {
        public static PublicOrganizationMetrics from(OrganizationMetricsCache cache) {
            return new PublicOrganizationMetrics(
                    cache.getActiveResidentCount(),
                    cache.getAvgRating(),
                    cache.getReviewCount(),
                    cache.getAvgResolutionDays(),
                    cache.getResolutionRate(),
                    cache.getOpenComplaintCount(),
                    cache.getAvgFirstResponseHours(),
                    cache.getAvailableBeds(),
                    cache.getAvailableUnits(),
                    cache.getTotalBeds(),
                    cache.getTotalUnits(),
                    cache.getSearchRankScore()
            );
        }

        public static PublicOrganizationMetrics empty() {
            return new PublicOrganizationMetrics(
                    0, null, 0, null, null, 0, null, null, null, null, null, null
            );
        }
    }
}
