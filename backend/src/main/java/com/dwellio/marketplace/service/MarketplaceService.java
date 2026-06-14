package com.dwellio.marketplace.service;

import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.OrganizationType;
import com.dwellio.marketplace.dto.PublicAmenityResponse;
import com.dwellio.marketplace.dto.PublicOrganizationResponse;
import com.dwellio.marketplace.dto.PublicOrganizationSummaryResponse;
import com.dwellio.marketplace.dto.PublicReviewResponse;
import com.dwellio.metrics.service.MetricsProjectionService;
import com.dwellio.organization.repository.OrganizationAmenityRepository;
import com.dwellio.organization.repository.OrganizationMetricsCacheRepository;
import com.dwellio.organization.repository.OrganizationRepository;
import com.dwellio.organization.service.OrganizationService;
import com.dwellio.review.repository.ReviewRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MarketplaceService {

    private static final int MAX_LIST_SIZE = 50;
    private static final int MAX_REVIEWS = 50;

    private final OrganizationService organizationService;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMetricsCacheRepository metricsCacheRepository;
    private final OrganizationAmenityRepository organizationAmenityRepository;
    private final MetricsProjectionService metricsProjectionService;
    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public List<PublicOrganizationSummaryResponse> search(
            String city,
            OrganizationType type,
            String query
    ) {
        String normalizedCity = emptyIfBlank(city);
        String normalizedQuery = emptyIfBlank(query);

        return organizationRepository.searchMarketplace(
                        OrganizationStatus.VERIFIED,
                        normalizedCity,
                        type,
                        normalizedQuery
                ).stream()
                .limit(MAX_LIST_SIZE)
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public PublicOrganizationResponse getPublicProfileBySlug(String slug) {
        Organization organization = organizationService.findActiveOrganizationBySlug(slug);
        if (organization.getStatus() != OrganizationStatus.VERIFIED) {
            throw new NotFoundException("Organization not found");
        }

        var cache = metricsCacheRepository.findById(organization.getId())
                .orElseGet(() -> metricsProjectionService.rebuild(organization.getId()));

        return PublicOrganizationResponse.from(
                organization,
                cache,
                listAmenities(organization.getId())
        );
    }

    private List<PublicAmenityResponse> listAmenities(UUID organizationId) {
        return organizationAmenityRepository.findAmenitiesByOrganizationId(organizationId).stream()
                .map(amenity -> new PublicAmenityResponse(amenity.getName(), amenity.getIcon()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PublicReviewResponse> listPublicReviewsBySlug(String slug) {
        Organization organization = organizationService.findActiveOrganizationBySlug(slug);
        if (organization.getStatus() != OrganizationStatus.VERIFIED) {
            throw new NotFoundException("Organization not found");
        }

        return reviewRepository.findAllActiveByOrganizationId(organization.getId()).stream()
                .limit(MAX_REVIEWS)
                .map(PublicReviewResponse::from)
                .toList();
    }

    private PublicOrganizationSummaryResponse toSummary(Organization organization) {
        return metricsCacheRepository.findById(organization.getId())
                .map(cache -> PublicOrganizationSummaryResponse.from(organization, cache))
                .orElseGet(() -> PublicOrganizationSummaryResponse.fromOrganization(organization));
    }

    private static String emptyIfBlank(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.trim();
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
