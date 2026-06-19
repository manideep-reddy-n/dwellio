import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { ComplaintStatus } from "@/types/enums";

export interface AdminPaged<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminDashboardMetrics {
  totalOrganizations: number;
  verifiedOrganizations: number;
  pendingVerification: number;
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalResidents: number;
  totalOwners: number;
  totalStaff: number;
  totalComplaints: number;
  openComplaints: number;
  resolvedComplaints: number;
  totalReviews: number;
  totalRevenue: number;
  outstandingBalance: number;
  verificationQueuePending: number;
  activePushSubscriptions: number;
  newUsersLast30Days: number;
  newOrganizationsLast30Days: number;
  recentActivity: AdminAuditLogEntry[];
}

export interface AdminAuditLogEntry {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  organizationName: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  platformAdmin: boolean;
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export interface AdminComplaint {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
  category: string;
  priority: string;
  status: ComplaintStatus;
  createdByName: string;
  assignedToName: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AdminReview {
  id: string;
  organizationId: string;
  organizationName: string;
  authorName: string;
  rating: number;
  body: string | null;
  hidden: boolean;
  createdAt: string;
}

export interface AdminPayment {
  id: string;
  organizationId: string;
  organizationName: string;
  residentName: string;
  billingMonth: string;
  amount: number;
  amountPaid: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

export interface AdminResident {
  membershipId: string;
  userId: string;
  fullName: string;
  email: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  joinedAt: string;
}

export interface PlatformSetting {
  id: string;
  settingKey: string;
  category: string;
  valueJson: Record<string, unknown>;
  description: string | null;
  updatedAt: string;
}

export interface AdminNotificationMetrics {
  activePushSubscriptions: number;
  pushSentLast24Hours: number;
  pushFailedLast24Hours: number;
  pushSkippedLast24Hours: number;
  inAppEnabledGlobally: boolean;
  pushEnabledGlobally: boolean;
}

export interface AdminMissionControl {
  platformHealth: {
    totalOrganizations: number;
    activeOrganizations: number;
    suspendedOrganizations: number;
    verifiedOrganizations: number;
    verificationPending: number;
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    userGrowthRate30d: number;
    totalRevenue: number;
    monthlyRevenue: number;
    revenueGrowthRate30d: number;
    totalComplaints: number;
    openComplaints: number;
    slaViolations: number;
    platformOccupancyRate: number;
  };
  liveActivity: {
    id: string;
    kind: string;
    title: string;
    subtitle: string | null;
    organizationName: string | null;
    occurredAt: string;
  }[];
  verification: {
    pendingCount: number;
    recentlyRejected: number;
    pendingQueue: {
      requestId: string;
      organizationId: string;
      organizationName: string;
      organizationSlug: string;
      status: string;
      submittedAt: string;
    }[];
    trends: { month: string; approved: number; rejected: number; pending: number }[];
  };
  revenue: {
    outstandingDues: number;
    forecastNextMonth: number;
    topRevenueOrganizations: AdminOrgMetricRank[];
    lowestCollectionRate: AdminOrgMetricRank[];
    highestDefaulters: AdminOrgMetricRank[];
    revenueTrend: { month: string; collected: number }[];
  };
  operations: {
    highestComplaintVolume: AdminOrgMetricRank[];
    poorestRatings: AdminOrgMetricRank[];
    slaViolationLeaders: AdminOrgMetricRank[];
    occupancyProblems: AdminOrgMetricRank[];
    decliningSatisfaction: AdminOrgMetricRank[];
  };
  residents: {
    recentlyJoined: AdminResidentInsight[];
    frequentComplaints: AdminResidentInsight[];
    outstandingDues: AdminResidentInsight[];
  };
  marketplace: {
    highestRated: AdminOrgMetricRank[];
    lowestRated: AdminOrgMetricRank[];
    highestTrustScore: AdminOrgMetricRank[];
    averageTrustScore: number;
    verifiedOrganizations: number;
    unverifiedOrganizations: number;
  };
}

export interface AdminOrgMetricRank {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationType: string;
  metricValue: number;
  metricLabel: string;
}

export interface AdminResidentInsight {
  membershipId: string;
  userId: string;
  fullName: string;
  organizationName: string;
  detail: string;
  occurredAt: string;
}

export interface AdminSearchHit {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  href: string;
}

export interface AdminSearchResult {
  query: string;
  users: AdminSearchHit[];
  organizations: AdminSearchHit[];
  residents: AdminSearchHit[];
  payments: AdminSearchHit[];
  complaints: AdminSearchHit[];
  reviews: AdminSearchHit[];
}

export interface NotificationDeliveryLogEntry {
  id: string;
  notificationId: string | null;
  userId: string;
  channel: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

function adminRequest<T>(path: string, options: Parameters<typeof apiRequest>[2] = {}) {
  return apiRequest<T>(apiConfig.baseUrl, path, options);
}

function pagedQuery(base: string, params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const q = search.toString();
  return `${base}${q ? `?${q}` : ""}`;
}

export const adminPlatformApi = {
  dashboard: () => adminRequest<AdminDashboardMetrics>("/admin/dashboard"),

  missionControl: () => adminRequest<AdminMissionControl>("/admin/mission-control"),

  search: (q: string) =>
    adminRequest<AdminSearchResult>(`/admin/search?q=${encodeURIComponent(q)}`),

  listUsers: (params?: { query?: string; page?: number; size?: number }) =>
    adminRequest<AdminPaged<AdminUser>>(pagedQuery("/admin/users", params ?? {})),

  getUser: (userId: string) => adminRequest<AdminUser>(`/admin/users/${userId}`),

  suspendUser: (userId: string) =>
    adminRequest<AdminUser>(`/admin/users/${userId}/suspend`, { method: "POST" }),

  activateUser: (userId: string) =>
    adminRequest<AdminUser>(`/admin/users/${userId}/activate`, { method: "POST" }),

  banUser: (userId: string) =>
    adminRequest<AdminUser>(`/admin/users/${userId}/ban`, { method: "POST" }),

  listComplaints: (params?: { status?: ComplaintStatus; query?: string; page?: number; size?: number }) =>
    adminRequest<AdminPaged<AdminComplaint>>(pagedQuery("/admin/complaints", params ?? {})),

  updateComplaint: (complaintId: string, body: { status?: ComplaintStatus; assignedToMembershipId?: string }) =>
    adminRequest<AdminComplaint>(`/admin/complaints/${complaintId}`, { method: "PATCH", body }),

  listReviews: (params?: { query?: string; includeHidden?: boolean; page?: number; size?: number }) =>
    adminRequest<AdminPaged<AdminReview>>(pagedQuery("/admin/reviews", params ?? {})),

  hideReview: (reviewId: string) =>
    adminRequest<AdminReview>(`/admin/reviews/${reviewId}/hide`, { method: "POST" }),

  restoreReview: (reviewId: string) =>
    adminRequest<AdminReview>(`/admin/reviews/${reviewId}/restore`, { method: "POST" }),

  listPayments: (params?: { query?: string; page?: number; size?: number }) =>
    adminRequest<AdminPaged<AdminPayment>>(pagedQuery("/admin/payments", params ?? {})),

  listResidents: (params?: { query?: string; page?: number; size?: number }) =>
    adminRequest<AdminPaged<AdminResident>>(pagedQuery("/admin/residents", params ?? {})),

  listAuditLogs: (params?: { page?: number; size?: number }) =>
    adminRequest<AdminPaged<AdminAuditLogEntry>>(pagedQuery("/admin/audit-logs", params ?? {})),

  listSettings: (category?: string) =>
    adminRequest<PlatformSetting[]>(
      `/admin/settings${category ? `?category=${encodeURIComponent(category)}` : ""}`,
    ),

  updateSetting: (settingKey: string, valueJson: Record<string, unknown>) =>
    adminRequest<PlatformSetting>(`/admin/settings/${encodeURIComponent(settingKey)}`, {
      method: "PATCH",
      body: { valueJson },
    }),

  notificationMetrics: () => adminRequest<AdminNotificationMetrics>("/admin/notifications/metrics"),

  deliveryLog: (params?: { page?: number; size?: number }) =>
    adminRequest<AdminPaged<NotificationDeliveryLogEntry>>(
      pagedQuery("/admin/notifications/delivery-log", params ?? {}),
    ),
};
