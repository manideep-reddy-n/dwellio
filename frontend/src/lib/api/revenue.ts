import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { RevenueTrendPoint } from "@/types/api/dashboard";

export interface RevenueSummary {
  expectedRevenueMonth: number | null;
  collectedRevenueMonth: number | null;
  outstandingRevenueMonth: number | null;
  collectionRate: number | null;
  defaultersCount: number;
  revenueTrend: RevenueTrendPoint[];
  forecastRevenueNextMonth: number | null;
}

export interface DefaulterRecord {
  membershipId: string;
  residentName: string;
  residentEmail: string;
  totalOutstanding: number;
  overduePaymentCount: number;
  oldestDueDate: string;
}

export const revenueApi = {
  summary: (orgId: string) =>
    apiRequest<RevenueSummary>(apiConfig.baseUrl, `/organizations/${orgId}/revenue/summary`),

  defaulters: (orgId: string) =>
    apiRequest<DefaulterRecord[]>(apiConfig.baseUrl, `/organizations/${orgId}/revenue/defaulters`),

  refresh: (orgId: string) =>
    apiRequest<RevenueSummary>(apiConfig.baseUrl, `/organizations/${orgId}/revenue/refresh`, {
      method: "POST",
    }),
};
