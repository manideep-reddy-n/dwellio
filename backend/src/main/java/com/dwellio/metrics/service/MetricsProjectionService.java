package com.dwellio.metrics.service;

import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.event.AfterCommitEventPublisher;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.OrganizationMetricsCache;
import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.metrics.projection.CompositeScoreProjection;
import com.dwellio.metrics.projection.MetricsAggregateRepository;
import com.dwellio.metrics.event.AvailabilityMetricsUpdatedEvent;
import com.dwellio.metrics.projection.RevenueMetricsSnapshot;
import com.dwellio.metrics.projection.snapshot.BedAvailabilitySnapshot;
import com.dwellio.metrics.projection.snapshot.MealRatingsSnapshot;
import com.dwellio.metrics.projection.snapshot.OccupancyLifecycleSnapshot;
import com.dwellio.metrics.projection.snapshot.SlaMetricsSnapshot;
import com.dwellio.metrics.projection.snapshot.ComplaintMetricsSnapshot;
import com.dwellio.metrics.projection.snapshot.ReviewMetricsSnapshot;
import com.dwellio.metrics.projection.snapshot.RoomAvailabilitySnapshot;
import com.dwellio.metrics.projection.snapshot.UnitAvailabilitySnapshot;
import com.dwellio.activity.service.ActivityEventBackfillService;
import com.dwellio.ledger.service.LedgerService;
import com.dwellio.organization.repository.OrganizationMetricsCacheRepository;
import com.dwellio.organization.repository.OrganizationRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
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

    private static final BigDecimal DEFAULT_SLA_FIRST_RESPONSE_HOURS = BigDecimal.valueOf(24);
    private static final BigDecimal DEFAULT_SLA_RESOLUTION_HOURS = BigDecimal.valueOf(72);

    private final OrganizationRepository organizationRepository;
    private final OrganizationMetricsCacheRepository metricsCacheRepository;
    private final MetricsAggregateRepository metricsAggregateRepository;
    private final LedgerService ledgerService;
    private final ActivityEventBackfillService activityEventBackfillService;
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
        applyRevenueProjection(cache, organizationId);
        cache.setActiveResidentCount(metricsAggregateRepository.countActiveResidents(organizationId));
        applyLifecycleProjection(cache, organizationId);
        applySlaProjection(cache, organization);
        applyPendingPaymentsProjection(cache, organizationId);
        applyMealProjection(cache, organizationId);
        applyCompositeScores(cache, organization);
        ledgerService.backfillOrganization(organizationId);
        activityEventBackfillService.backfillOrganization(organizationId);
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
        applySlaProjection(cache, organization);
        applyCompositeScores(cache, organization);
        cache.setRefreshedAt(Instant.now(clock));
        metricsCacheRepository.save(cache);
    }

    @Transactional
    public void refreshLifecycleMetrics(UUID organizationId) {
        Organization organization = organizationRepository.findActiveById(organizationId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));

        OrganizationMetricsCache cache = metricsCacheRepository.findById(organizationId)
                .orElseGet(() -> createEmptyCache(organization));

        cache.setActiveResidentCount(metricsAggregateRepository.countActiveResidents(organizationId));
        applyLifecycleProjection(cache, organizationId);
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
        applyCompositeScores(cache, organization);
        cache.setRefreshedAt(Instant.now(clock));
        metricsCacheRepository.save(cache);
    }

    @Transactional
    public OrganizationMetricsCache refreshRevenueMetrics(UUID organizationId) {
        Organization organization = organizationRepository.findActiveById(organizationId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));

        OrganizationMetricsCache cache = metricsCacheRepository.findById(organizationId)
                .orElseGet(() -> createEmptyCache(organization));

        applyRevenueProjection(cache, organizationId);
        applyPendingPaymentsProjection(cache, organizationId);
        cache.setRefreshedAt(Instant.now(clock));
        return metricsCacheRepository.save(cache);
    }

    @Transactional
    public void refreshMealMetrics(UUID organizationId) {
        Organization organization = organizationRepository.findActiveById(organizationId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));

        OrganizationMetricsCache cache = metricsCacheRepository.findById(organizationId)
                .orElseGet(() -> createEmptyCache(organization));

        applyMealProjection(cache, organizationId);
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

    private void applyRevenueProjection(OrganizationMetricsCache cache, UUID organizationId) {
        RevenueMetricsSnapshot revenue = metricsAggregateRepository.aggregateRevenue(
                organizationId,
                LocalDate.now(clock)
        );
        cache.setExpectedRevenueMonth(revenue.expectedRevenueMonth());
        cache.setCollectedRevenueMonth(revenue.collectedRevenueMonth());
        cache.setOutstandingRevenueMonth(revenue.outstandingRevenueMonth());
        cache.setCollectionRate(revenue.collectionRate());
        cache.setDefaultersCount(revenue.defaultersCount());
        cache.setRevenueTrendJson(revenue.revenueTrend());
        cache.setForecastRevenueNextMonth(revenue.forecastRevenueNextMonth());
    }

    private void applyLifecycleProjection(OrganizationMetricsCache cache, UUID organizationId) {
        OccupancyLifecycleSnapshot lifecycle = metricsAggregateRepository.aggregateOccupancyLifecycle(
                organizationId,
                LocalDate.now(clock),
                cache.getActiveResidentCount()
        );
        cache.setMoveInsMonth(lifecycle.moveInsMonth());
        cache.setMoveOutsMonth(lifecycle.moveOutsMonth());
        cache.setAvgStayDays(lifecycle.avgStayDays());
        cache.setTurnoverRate(lifecycle.turnoverRate());
    }

    private void applySlaProjection(OrganizationMetricsCache cache, Organization organization) {
        BigDecimal firstResponseHours = organization.getSlaFirstResponseHours() != null
                ? organization.getSlaFirstResponseHours()
                : DEFAULT_SLA_FIRST_RESPONSE_HOURS;
        BigDecimal resolutionHours = organization.getSlaResolutionHours() != null
                ? organization.getSlaResolutionHours()
                : DEFAULT_SLA_RESOLUTION_HOURS;
        cache.setSlaFirstResponseHours(firstResponseHours);
        cache.setSlaResolutionHours(resolutionHours);

        SlaMetricsSnapshot sla = metricsAggregateRepository.aggregateSlaMetrics(
                organization.getId(),
                firstResponseHours,
                resolutionHours,
                Instant.now(clock)
        );
        cache.setSlaComplianceRate(sla.slaComplianceRate());
        cache.setSlaViolationsCount(sla.slaViolationsCount());
        cache.setReopenedComplaintsCount(sla.reopenedComplaintsCount());
    }

    private void applyPendingPaymentsProjection(OrganizationMetricsCache cache, UUID organizationId) {
        cache.setPendingPaymentsCount(metricsAggregateRepository.countPendingPayments(organizationId));
    }

    private void applyMealProjection(OrganizationMetricsCache cache, UUID organizationId) {
        MealRatingsSnapshot meals = metricsAggregateRepository.aggregateMealRatings(organizationId);
        cache.setAvgBreakfastRating(meals.avgBreakfastRating());
        cache.setAvgLunchRating(meals.avgLunchRating());
        cache.setAvgDinnerRating(meals.avgDinnerRating());
        cache.setMealRatingsTrendJson(meals.trend());
    }

    private void applyCompositeScores(OrganizationMetricsCache cache, Organization organization) {
        BigDecimal satisfaction = CompositeScoreProjection.computeSatisfactionScore(cache, organization);
        cache.setSatisfactionScore(satisfaction);
        cache.setSearchRankScore(CompositeScoreProjection.computeSearchRankScore(cache, satisfaction));
    }

    private OrganizationMetricsCache createEmptyCache(Organization organization) {
        OrganizationMetricsCache cache = new OrganizationMetricsCache();
        cache.setOrganization(organization);
        cache.setAccommodationMode(organization.getAccommodationMode());
        cache.setActiveResidentCount(0);
        cache.setReviewCount(0);
        cache.setOpenComplaintCount(0);
        cache.setComplaintCategoryCounts(new HashMap<>());
        cache.setRevenueTrendJson(new ArrayList<>());
        cache.setDefaultersCount(0);
        cache.setMoveInsMonth(0);
        cache.setMoveOutsMonth(0);
        cache.setPendingPaymentsCount(0);
        cache.setSlaFirstResponseHours(DEFAULT_SLA_FIRST_RESPONSE_HOURS);
        cache.setSlaResolutionHours(DEFAULT_SLA_RESOLUTION_HOURS);
        cache.setSlaViolationsCount(0);
        cache.setReopenedComplaintsCount(0);
        cache.setMealRatingsTrendJson(new ArrayList<>());
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
