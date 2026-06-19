package com.dwellio.admin.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminMissionControlResponse(
        PlatformHealthSection platformHealth,
        List<LiveActivityItem> liveActivity,
        VerificationCommandSection verification,
        RevenueCommandSection revenue,
        OperationsCommandSection operations,
        ResidentIntelligenceSection residents,
        MarketplaceIntelligenceSection marketplace
) {
    public record PlatformHealthSection(
            long totalOrganizations,
            long activeOrganizations,
            long suspendedOrganizations,
            long verifiedOrganizations,
            long verificationPending,
            long totalUsers,
            long activeUsers,
            long newUsersToday,
            double userGrowthRate30d,
            BigDecimal totalRevenue,
            BigDecimal monthlyRevenue,
            double revenueGrowthRate30d,
            long totalComplaints,
            long openComplaints,
            long slaViolations,
            double platformOccupancyRate
    ) {
    }

    public record LiveActivityItem(
            String id,
            String kind,
            String title,
            String subtitle,
            String organizationName,
            Instant occurredAt
    ) {
    }

    public record VerificationCommandSection(
            long pendingCount,
            long recentlyRejected,
            List<VerificationQueueItem> pendingQueue,
            List<VerificationTrendPoint> trends
    ) {
    }

    public record VerificationQueueItem(
            UUID requestId,
            UUID organizationId,
            String organizationName,
            String organizationSlug,
            String status,
            Instant submittedAt
    ) {
    }

    public record VerificationTrendPoint(String month, long approved, long rejected, long pending) {
    }

    public record RevenueCommandSection(
            BigDecimal outstandingDues,
            BigDecimal forecastNextMonth,
            List<OrgMetricRankItem> topRevenueOrganizations,
            List<OrgMetricRankItem> lowestCollectionRate,
            List<OrgMetricRankItem> highestDefaulters,
            List<RevenueTrendPoint> revenueTrend
    ) {
    }

    public record RevenueTrendPoint(String month, BigDecimal collected) {
    }

    public record OperationsCommandSection(
            List<OrgMetricRankItem> highestComplaintVolume,
            List<OrgMetricRankItem> poorestRatings,
            List<OrgMetricRankItem> slaViolationLeaders,
            List<OrgMetricRankItem> occupancyProblems,
            List<OrgMetricRankItem> decliningSatisfaction
    ) {
    }

    public record ResidentIntelligenceSection(
            List<ResidentInsightItem> recentlyJoined,
            List<ResidentInsightItem> frequentComplaints,
            List<ResidentInsightItem> outstandingDues
    ) {
    }

    public record ResidentInsightItem(
            UUID membershipId,
            UUID userId,
            String fullName,
            String organizationName,
            String detail,
            Instant occurredAt
    ) {
    }

    public record MarketplaceIntelligenceSection(
            List<OrgMetricRankItem> highestRated,
            List<OrgMetricRankItem> lowestRated,
            List<OrgMetricRankItem> highestTrustScore,
            double averageTrustScore,
            long verifiedOrganizations,
            long unverifiedOrganizations
    ) {
    }

    public record OrgMetricRankItem(
            UUID organizationId,
            String organizationName,
            String organizationSlug,
            String organizationType,
            BigDecimal metricValue,
            String metricLabel
    ) {
    }
}
