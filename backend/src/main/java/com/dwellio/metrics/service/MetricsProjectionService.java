package com.dwellio.metrics.service;

import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.event.AfterCommitEventPublisher;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.OrganizationMetricsCache;
import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.metrics.projection.MetricsAggregateRepository;
import com.dwellio.metrics.event.AvailabilityMetricsUpdatedEvent;
import com.dwellio.metrics.projection.snapshot.BedAvailabilitySnapshot;
import com.dwellio.metrics.projection.snapshot.ComplaintMetricsSnapshot;
import com.dwellio.metrics.projection.snapshot.ReviewMetricsSnapshot;
import com.dwellio.metrics.projection.snapshot.RoomAvailabilitySnapshot;
import com.dwellio.metrics.projection.snapshot.UnitAvailabilitySnapshot;
import com.dwellio.organization.repository.OrganizationMetricsCacheRepository;
import com.dwellio.organization.repository.OrganizationRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MetricsProjectionService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMetricsCacheRepository metricsCacheRepository;
    private final MetricsAggregateRepository metricsAggregateRepository;
    private final AfterCommitEventPublisher afterCommitEventPublisher;
    private final Clock clock;

    @Transactional
    public OrganizationMetricsCache rebuild(UUID organizationId) {
        Organization organization = organizationRepository.findActiveById(organizationId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));

        OrganizationMetricsCache cache = metricsCacheRepository.findById(organizationId)
                .orElseGet(() -> createEmptyCache(organization));

        applyAvailabilityProjection(cache, organization);
        applyComplaintProjection(cache, organization.getId());
        applyReviewProjection(cache, organization.getId());
        cache.setActiveResidentCount(metricsAggregateRepository.countActiveResidents(organizationId));
        cache.setRefreshedAt(Instant.now(clock));
        OrganizationMetricsCache saved = metricsCacheRepository.save(cache);
        publishAvailabilityUpdated(saved);
        return saved;
    }

    @Transactional
    public void refreshAvailability(UUID organizationId) {
        Organization organization = organizationRepository.findActiveById(organizationId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));

        OrganizationMetricsCache cache = metricsCacheRepository.findById(organizationId)
                .orElseGet(() -> createEmptyCache(organization));

        applyAvailabilityProjection(cache, organization);
        cache.setRefreshedAt(Instant.now(clock));
        OrganizationMetricsCache saved = metricsCacheRepository.save(cache);
        publishAvailabilityUpdated(saved);
    }

    @Transactional
    public void refreshResidentCount(UUID organizationId) {
        Organization organization = organizationRepository.findActiveById(organizationId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));

        OrganizationMetricsCache cache = metricsCacheRepository.findById(organizationId)
                .orElseGet(() -> createEmptyCache(organization));

        cache.setActiveResidentCount(metricsAggregateRepository.countActiveResidents(organizationId));
        cache.setRefreshedAt(Instant.now(clock));
        metricsCacheRepository.save(cache);
    }

    @Transactional
    public void refreshComplaintMetrics(UUID organizationId) {
        Organization organization = organizationRepository.findActiveById(organizationId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));

        OrganizationMetricsCache cache = metricsCacheRepository.findById(organizationId)
                .orElseGet(() -> createEmptyCache(organization));

        applyComplaintProjection(cache, organizationId);
        cache.setRefreshedAt(Instant.now(clock));
        metricsCacheRepository.save(cache);
    }

    @Transactional
    public void refreshReviewMetrics(UUID organizationId) {
        Organization organization = organizationRepository.findActiveById(organizationId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));

        OrganizationMetricsCache cache = metricsCacheRepository.findById(organizationId)
                .orElseGet(() -> createEmptyCache(organization));

        applyReviewProjection(cache, organizationId);
        cache.setRefreshedAt(Instant.now(clock));
        metricsCacheRepository.save(cache);
    }

    @Transactional(readOnly = true)
    public OrganizationMetricsCache getCache(UUID organizationId) {
        return metricsCacheRepository.findById(organizationId)
                .orElseThrow(() -> new NotFoundException("Organization metrics not found"));
    }

    private void applyAvailabilityProjection(OrganizationMetricsCache cache, Organization organization) {
        cache.setAccommodationMode(organization.getAccommodationMode());

        if (organization.getAccommodationMode() == AccommodationMode.BED_BASED) {
            BedAvailabilitySnapshot beds = metricsAggregateRepository.aggregateBeds(organization.getId());
            RoomAvailabilitySnapshot rooms = metricsAggregateRepository.aggregateRooms(organization.getId());

            cache.setTotalBeds(beds.totalBeds());
            cache.setBlockedBeds(beds.blockedBeds());
            cache.setOccupiedBeds(beds.occupiedBeds());
            cache.setAvailableBeds(beds.availableBeds());

            cache.setTotalRooms(rooms.totalRooms());
            cache.setVacantRooms(rooms.vacantRooms());
            cache.setPartialRooms(rooms.partialRooms());
            cache.setOccupiedRooms(rooms.occupiedRooms());
            cache.setBlockedRooms(rooms.blockedRooms());

            cache.setTotalUnits(null);
            cache.setAvailableUnits(null);
            cache.setOccupiedUnits(null);
            cache.setBlockedUnits(null);
        } else {
            UnitAvailabilitySnapshot units = metricsAggregateRepository.aggregateUnits(organization.getId());

            cache.setTotalUnits(units.totalUnits());
            cache.setBlockedUnits(units.blockedUnits());
            cache.setOccupiedUnits(units.occupiedUnits());
            cache.setAvailableUnits(units.availableUnits());

            cache.setTotalRooms(null);
            cache.setVacantRooms(null);
            cache.setPartialRooms(null);
            cache.setOccupiedRooms(null);
            cache.setBlockedRooms(null);
            cache.setTotalBeds(null);
            cache.setAvailableBeds(null);
            cache.setOccupiedBeds(null);
            cache.setBlockedBeds(null);
        }
    }

    private void applyComplaintProjection(OrganizationMetricsCache cache, UUID organizationId) {
        ComplaintMetricsSnapshot complaints = metricsAggregateRepository.aggregateComplaints(organizationId);
        cache.setOpenComplaintCount(complaints.openComplaintCount());
        cache.setAvgResolutionDays(complaints.avgResolutionDays());
        cache.setResolutionRate(complaints.resolutionRate());
        cache.setAvgFirstResponseHours(complaints.avgFirstResponseHours());
        cache.setComplaintCategoryCounts(metricsAggregateRepository.aggregateComplaintCountsByCategory(organizationId));
    }

    private void applyReviewProjection(OrganizationMetricsCache cache, UUID organizationId) {
        ReviewMetricsSnapshot reviews = metricsAggregateRepository.aggregateReviews(organizationId);
        cache.setAvgRating(reviews.avgRating());
        cache.setReviewCount(reviews.reviewCount());
    }

    private OrganizationMetricsCache createEmptyCache(Organization organization) {
        OrganizationMetricsCache cache = new OrganizationMetricsCache();
        cache.setOrganization(organization);
        cache.setAccommodationMode(organization.getAccommodationMode());
        cache.setActiveResidentCount(0);
        cache.setReviewCount(0);
        cache.setOpenComplaintCount(0);
        cache.setComplaintCategoryCounts(new HashMap<>());
        cache.setRefreshedAt(Instant.now(clock));
        return cache;
    }

    private void publishAvailabilityUpdated(OrganizationMetricsCache cache) {
        afterCommitEventPublisher.publish(new AvailabilityMetricsUpdatedEvent(
                cache.getOrganizationId(),
                cache.getAvailableBeds(),
                cache.getAvailableUnits()
        ));
    }
}
