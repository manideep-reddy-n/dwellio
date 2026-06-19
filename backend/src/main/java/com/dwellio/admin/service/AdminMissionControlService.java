package com.dwellio.admin.service;

import com.dwellio.activity.repository.ActivityEventRepository;
import com.dwellio.admin.dto.AdminMissionControlResponse;
import com.dwellio.admin.dto.AdminMissionControlResponse.LiveActivityItem;
import com.dwellio.admin.dto.AdminMissionControlResponse.MarketplaceIntelligenceSection;
import com.dwellio.admin.dto.AdminMissionControlResponse.OperationsCommandSection;
import com.dwellio.admin.dto.AdminMissionControlResponse.OrgMetricRankItem;
import com.dwellio.admin.dto.AdminMissionControlResponse.PlatformHealthSection;
import com.dwellio.admin.dto.AdminMissionControlResponse.ResidentInsightItem;
import com.dwellio.admin.dto.AdminMissionControlResponse.ResidentIntelligenceSection;
import com.dwellio.admin.dto.AdminMissionControlResponse.RevenueCommandSection;
import com.dwellio.admin.dto.AdminMissionControlResponse.RevenueTrendPoint;
import com.dwellio.admin.dto.AdminMissionControlResponse.VerificationCommandSection;
import com.dwellio.admin.dto.AdminMissionControlResponse.VerificationQueueItem;
import com.dwellio.admin.dto.AdminMissionControlResponse.VerificationTrendPoint;
import com.dwellio.audit.repository.AuditLogRepository;
import com.dwellio.auth.repository.UserRepository;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.complaint.repository.ComplaintRepository;
import com.dwellio.domain.entity.ActivityEvent;
import com.dwellio.domain.entity.AuditLog;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.OrganizationMetricsCache;
import com.dwellio.domain.entity.OrganizationVerificationRequest;
import com.dwellio.domain.enums.ComplaintStatus;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.VerificationRequestStatus;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.organization.repository.OrganizationMetricsCacheRepository;
import com.dwellio.organization.repository.OrganizationRepository;
import com.dwellio.payment.repository.PaymentRepository;
import com.dwellio.verification.repository.OrganizationVerificationRequestRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminMissionControlService {

    private final AuthorizationService authorizationService;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMetricsCacheRepository metricsCacheRepository;
    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final PaymentRepository paymentRepository;
    private final MembershipRepository membershipRepository;
    private final OrganizationVerificationRequestRepository verificationRequestRepository;
    private final ActivityEventRepository activityEventRepository;
    private final AuditLogRepository auditLogRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public AdminMissionControlResponse getMissionControl() {
        authorizationService.requirePlatformAdmin();

        List<OrganizationMetricsCache> caches = metricsCacheRepository.findAllWithActiveOrganizations();
        Instant now = Instant.now(clock);
        Instant todayStart = LocalDate.now(clock).atStartOfDay(clock.getZone()).toInstant();
        Instant thirtyDaysAgo = now.minus(30, ChronoUnit.DAYS);
        Instant sixtyDaysAgo = now.minus(60, ChronoUnit.DAYS);

        long usersLast30 = userRepository.countCreatedSince(thirtyDaysAgo);
        long usersPrev30 = userRepository.countCreatedBetween(sixtyDaysAgo, thirtyDaysAgo);
        double userGrowth = growthRate(usersPrev30, usersLast30);

        BigDecimal monthlyRevenue = sum(caches, OrganizationMetricsCache::getCollectedRevenueMonth);
        BigDecimal prevMonthRevenue = estimatePreviousMonthRevenue(caches);
        double revenueGrowth = growthRateDecimal(prevMonthRevenue, monthlyRevenue);

        int totalCapacity = caches.stream().mapToInt(this::totalCapacity).sum();
        int totalOccupied = caches.stream().mapToInt(this::totalOccupied).sum();
        double occupancyRate = totalCapacity > 0 ? (totalOccupied * 100.0) / totalCapacity : 0;

        PlatformHealthSection health = new PlatformHealthSection(
                organizationRepository.countActive(),
                organizationRepository.countActive() - organizationRepository.countSuspended(),
                organizationRepository.countSuspended(),
                organizationRepository.countActiveByStatus(OrganizationStatus.VERIFIED),
                organizationRepository.countActiveByStatus(OrganizationStatus.PENDING_VERIFICATION),
                userRepository.countAllIncludingDeleted(),
                userRepository.countActive(),
                userRepository.countCreatedSince(todayStart),
                userGrowth,
                paymentRepository.sumTotalRevenue(),
                monthlyRevenue,
                revenueGrowth,
                complaintRepository.countActive(),
                openComplaints(),
                caches.stream().mapToLong(OrganizationMetricsCache::getSlaViolationsCount).sum(),
                round(occupancyRate)
        );

        return new AdminMissionControlResponse(
                health,
                buildLiveActivity(),
                buildVerification(),
                buildRevenue(caches),
                buildOperations(caches),
                buildResidents(),
                buildMarketplace(caches)
        );
    }

    private long openComplaints() {
        return complaintRepository.countActiveByStatus(ComplaintStatus.OPEN)
                + complaintRepository.countActiveByStatus(ComplaintStatus.IN_PROGRESS)
                + complaintRepository.countActiveByStatus(ComplaintStatus.REOPENED);
    }

    private List<LiveActivityItem> buildLiveActivity() {
        List<LiveActivityItem> items = new ArrayList<>();

        for (ActivityEvent event : activityEventRepository.findRecentPlatformWide(PageRequest.of(0, 15))) {
            items.add(new LiveActivityItem(
                    event.getId().toString(),
                    "ACTIVITY",
                    event.getTitle(),
                    event.getEventType(),
                    event.getOrganization().getName(),
                    event.getOccurredAt()
            ));
        }

        for (AuditLog log : auditLogRepository.findAllOrderByCreatedAtDesc(PageRequest.of(0, 10))) {
            items.add(new LiveActivityItem(
                    log.getId().toString(),
                    "AUDIT",
                    log.getAction().replace('_', ' '),
                    log.getEntityType(),
                    log.getOrganization() != null ? log.getOrganization().getName() : "Platform",
                    log.getCreatedAt()
            ));
        }

        return items.stream()
                .sorted(Comparator.comparing(LiveActivityItem::occurredAt).reversed())
                .limit(25)
                .toList();
    }

    private VerificationCommandSection buildVerification() {
        List<OrganizationVerificationRequest> all = verificationRequestRepository.findAllWithOrganization();
        long rejectedRecent = all.stream()
                .filter(r -> r.getStatus() == VerificationRequestStatus.REJECTED)
                .filter(r -> r.getReviewedAt() != null && r.getReviewedAt().isAfter(Instant.now(clock).minus(30, ChronoUnit.DAYS)))
                .count();

        List<VerificationQueueItem> pending = all.stream()
                .filter(r -> r.getStatus() == VerificationRequestStatus.PENDING && r.getSubmittedAt() != null)
                .sorted(Comparator.comparing(OrganizationVerificationRequest::getSubmittedAt))
                .limit(8)
                .map(r -> new VerificationQueueItem(
                        r.getId(),
                        r.getOrganization().getId(),
                        r.getOrganization().getName(),
                        r.getOrganization().getSlug(),
                        r.getStatus().name(),
                        r.getSubmittedAt()
                ))
                .toList();

        Map<String, long[]> trends = new LinkedHashMap<>();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("yyyy-MM").withZone(ZoneOffset.UTC);
        for (OrganizationVerificationRequest request : all) {
            if (request.getSubmittedAt() == null) continue;
            String month = monthFmt.format(request.getSubmittedAt());
            long[] counts = trends.computeIfAbsent(month, k -> new long[3]);
            switch (request.getStatus()) {
                case APPROVED -> counts[0]++;
                case REJECTED -> counts[1]++;
                case PENDING, MORE_INFO_REQUIRED -> counts[2]++;
                default -> { }
            }
        }

        List<VerificationTrendPoint> trendPoints = trends.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new VerificationTrendPoint(e.getKey(), e.getValue()[0], e.getValue()[1], e.getValue()[2]))
                .toList();

        return new VerificationCommandSection(
                verificationRequestRepository.countByStatus(VerificationRequestStatus.PENDING),
                rejectedRecent,
                pending,
                trendPoints
        );
    }

    private RevenueCommandSection buildRevenue(List<OrganizationMetricsCache> caches) {
        List<OrgMetricRankItem> topRevenue = caches.stream()
                .sorted(Comparator.comparing(
                        c -> c.getCollectedRevenueMonth() != null ? c.getCollectedRevenueMonth() : BigDecimal.ZERO,
                        Comparator.reverseOrder()
                ))
                .limit(5)
                .map(c -> orgRank(c, c.getCollectedRevenueMonth(), "collected this month"))
                .toList();

        List<OrgMetricRankItem> lowestCollection = caches.stream()
                .filter(c -> c.getCollectionRate() != null)
                .sorted(Comparator.comparing(OrganizationMetricsCache::getCollectionRate))
                .limit(5)
                .map(c -> orgRank(c, c.getCollectionRate(), "% collection rate"))
                .toList();

        List<OrgMetricRankItem> defaulters = caches.stream()
                .filter(c -> c.getDefaultersCount() > 0)
                .sorted(Comparator.comparingInt(OrganizationMetricsCache::getDefaultersCount).reversed())
                .limit(5)
                .map(c -> orgRank(c, BigDecimal.valueOf(c.getDefaultersCount()), "defaulters"))
                .toList();

        Map<String, BigDecimal> trendMap = new LinkedHashMap<>();
        for (OrganizationMetricsCache cache : caches) {
            for (Map<String, Object> point : cache.getRevenueTrendJson()) {
                Object month = point.get("month");
                Object collected = point.get("collected");
                if (month == null || collected == null) continue;
                BigDecimal value = new BigDecimal(collected.toString());
                trendMap.merge(month.toString(), value, BigDecimal::add);
            }
        }

        List<RevenueTrendPoint> trend = trendMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new RevenueTrendPoint(e.getKey(), e.getValue()))
                .toList();

        BigDecimal outstanding = sum(caches, OrganizationMetricsCache::getOutstandingRevenueMonth);
        BigDecimal forecast = sum(caches, c -> c.getForecastRevenueNextMonth());

        return new RevenueCommandSection(outstanding, forecast, topRevenue, lowestCollection, defaulters, trend);
    }

    private OperationsCommandSection buildOperations(List<OrganizationMetricsCache> caches) {
        return new OperationsCommandSection(
                topByInt(caches, OrganizationMetricsCache::getOpenComplaintCount, "open complaints"),
                bottomByRating(caches),
                topByInt(caches, OrganizationMetricsCache::getSlaViolationsCount, "SLA violations"),
                lowestOccupancy(caches),
                lowestSatisfaction(caches)
        );
    }

    private ResidentIntelligenceSection buildResidents() {
        var page = membershipRepository.searchActiveResidentsForAdmin(null, PageRequest.of(0, 8));
        List<ResidentInsightItem> joined = page.getContent().stream()
                .map(m -> new ResidentInsightItem(
                        m.getId(),
                        m.getUser().getId(),
                        m.getUser().getFullName(),
                        m.getOrganization().getName(),
                        "Active resident",
                        m.getJoinedAt()
                ))
                .toList();

        return new ResidentIntelligenceSection(joined, List.of(), List.of());
    }

    private MarketplaceIntelligenceSection buildMarketplace(List<OrganizationMetricsCache> caches) {
        List<OrgMetricRankItem> highestRated = caches.stream()
                .filter(c -> c.getReviewCount() > 0 && c.getAvgRating() != null)
                .sorted(Comparator.comparing(OrganizationMetricsCache::getAvgRating).reversed())
                .limit(5)
                .map(c -> orgRank(c, c.getAvgRating(), "avg rating"))
                .toList();

        List<OrgMetricRankItem> lowestRated = caches.stream()
                .filter(c -> c.getReviewCount() > 0 && c.getAvgRating() != null)
                .sorted(Comparator.comparing(OrganizationMetricsCache::getAvgRating))
                .limit(5)
                .map(c -> orgRank(c, c.getAvgRating(), "avg rating"))
                .toList();

        List<OrgMetricRankItem> trustLeaders = caches.stream()
                .filter(c -> c.getSearchRankScore() != null)
                .sorted(Comparator.comparing(OrganizationMetricsCache::getSearchRankScore).reversed())
                .limit(5)
                .map(c -> orgRank(c, c.getSearchRankScore(), "trust score"))
                .toList();

        double avgTrust = caches.stream()
                .map(OrganizationMetricsCache::getSearchRankScore)
                .filter(s -> s != null)
                .mapToDouble(BigDecimal::doubleValue)
                .average()
                .orElse(0);

        long verified = organizationRepository.countActiveByStatus(OrganizationStatus.VERIFIED);
        long total = organizationRepository.countActive();

        return new MarketplaceIntelligenceSection(
                highestRated,
                lowestRated,
                trustLeaders,
                round(avgTrust),
                verified,
                total - verified
        );
    }

    private List<OrgMetricRankItem> topByInt(
            List<OrganizationMetricsCache> caches,
            java.util.function.ToIntFunction<OrganizationMetricsCache> extractor,
            String label
    ) {
        return caches.stream()
                .sorted(Comparator.comparingInt(extractor).reversed())
                .limit(5)
                .map(c -> orgRank(c, BigDecimal.valueOf(extractor.applyAsInt(c)), label))
                .toList();
    }

    private List<OrgMetricRankItem> bottomByRating(List<OrganizationMetricsCache> caches) {
        return caches.stream()
                .filter(c -> c.getAvgRating() != null && c.getReviewCount() > 0)
                .sorted(Comparator.comparing(OrganizationMetricsCache::getAvgRating))
                .limit(5)
                .map(c -> orgRank(c, c.getAvgRating(), "avg rating"))
                .toList();
    }

    private List<OrgMetricRankItem> lowestOccupancy(List<OrganizationMetricsCache> caches) {
        return caches.stream()
                .filter(c -> totalCapacity(c) > 0)
                .sorted(Comparator.comparingDouble(c -> occupancyPercent(c)))
                .limit(5)
                .map(c -> orgRank(c, BigDecimal.valueOf(round(occupancyPercent(c))), "% occupied"))
                .toList();
    }

    private List<OrgMetricRankItem> lowestSatisfaction(List<OrganizationMetricsCache> caches) {
        return caches.stream()
                .filter(c -> c.getSatisfactionScore() != null)
                .sorted(Comparator.comparing(OrganizationMetricsCache::getSatisfactionScore))
                .limit(5)
                .map(c -> orgRank(c, c.getSatisfactionScore(), "satisfaction"))
                .toList();
    }

    private OrgMetricRankItem orgRank(OrganizationMetricsCache cache, BigDecimal value, String label) {
        Organization org = cache.getOrganization();
        return new OrgMetricRankItem(
                org.getId(),
                org.getName(),
                org.getSlug(),
                org.getType().name(),
                value != null ? value : BigDecimal.ZERO,
                label
        );
    }

    private int totalCapacity(OrganizationMetricsCache c) {
        return nullSafe(c.getTotalBeds()) + nullSafe(c.getTotalUnits()) + nullSafe(c.getTotalRooms());
    }

    private int totalOccupied(OrganizationMetricsCache c) {
        return nullSafe(c.getOccupiedBeds()) + nullSafe(c.getOccupiedUnits()) + nullSafe(c.getOccupiedRooms());
    }

    private double occupancyPercent(OrganizationMetricsCache c) {
        int cap = totalCapacity(c);
        return cap > 0 ? (totalOccupied(c) * 100.0) / cap : 0;
    }

    private int nullSafe(Integer value) {
        return value != null ? value : 0;
    }

    private BigDecimal sum(
            List<OrganizationMetricsCache> caches,
            java.util.function.Function<OrganizationMetricsCache, BigDecimal> extractor
    ) {
        return caches.stream()
                .map(extractor)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal estimatePreviousMonthRevenue(List<OrganizationMetricsCache> caches) {
        Map<String, BigDecimal> totals = new HashMap<>();
        for (OrganizationMetricsCache cache : caches) {
            List<Map<String, Object>> trend = cache.getRevenueTrendJson();
            if (trend.size() < 2) continue;
            Map<String, Object> prev = trend.get(trend.size() - 2);
            Object collected = prev.get("collected");
            if (collected != null) {
                totals.merge("prev", new BigDecimal(collected.toString()), BigDecimal::add);
            }
        }
        return totals.getOrDefault("prev", BigDecimal.ZERO);
    }

    private double growthRate(long previous, long current) {
        if (previous <= 0) return current > 0 ? 100.0 : 0.0;
        return round(((current - previous) * 100.0) / previous);
    }

    private double growthRateDecimal(BigDecimal previous, BigDecimal current) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) <= 0) {
            return current != null && current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        return round(current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous, 2, RoundingMode.HALF_UP)
                .doubleValue());
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}
