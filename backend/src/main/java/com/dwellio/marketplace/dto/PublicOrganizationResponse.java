package com.dwellio.marketplace.dto;

import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.OrganizationMetricsCache;
import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.domain.enums.HostelAudience;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.OrganizationType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PublicOrganizationResponse(
        UUID id,
        String slug,
        String name,
        String description,
        OrganizationType type,
        HostelAudience hostelAudience,
        AccommodationMode accommodationMode,
        String city,
        String area,
        BigDecimal latitude,
        BigDecimal longitude,
        String contactPhone,
        String contactEmail,
        String logoUrl,
        boolean verified,
        PublicOrganizationMetrics metrics,
        List<PublicAmenityResponse> amenities
) {
    public static PublicOrganizationResponse from(
            Organization organization,
            OrganizationMetricsCache cache,
            List<PublicAmenityResponse> amenities
    ) {
        return new PublicOrganizationResponse(
                organization.getId(),
                organization.getSlug(),
                organization.getName(),
                organization.getDescription(),
                organization.getType(),
                organization.getHostelAudience(),
                organization.getAccommodationMode(),
                organization.getCity(),
                organization.getArea(),
                organization.getLatitude(),
                organization.getLongitude(),
                organization.getContactPhone(),
                organization.getContactEmail(),
                organization.getLogoUrl(),
                organization.getStatus() == OrganizationStatus.VERIFIED,
                PublicOrganizationMetrics.from(cache),
                amenities
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
            Instant refreshedAt
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
                    cache.getRefreshedAt()
            );
        }
    }
}
