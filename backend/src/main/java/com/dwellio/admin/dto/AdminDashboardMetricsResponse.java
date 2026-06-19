package com.dwellio.admin.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardMetricsResponse(
        long totalOrganizations,
        long verifiedOrganizations,
        long pendingVerification,
        long totalUsers,
        long activeUsers,
        long suspendedUsers,
        long totalResidents,
        long totalOwners,
        long totalStaff,
        long totalComplaints,
        long openComplaints,
        long resolvedComplaints,
        long totalReviews,
        BigDecimal totalRevenue,
        BigDecimal outstandingBalance,
        long verificationQueuePending,
        long activePushSubscriptions,
        long newUsersLast30Days,
        long newOrganizationsLast30Days,
        List<AdminAuditLogSummary> recentActivity
) {
}
