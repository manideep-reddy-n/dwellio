import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { OrganizationMetrics } from "@/types/api/dashboard";

export const dashboardApi = {
  get: (orgId: string) =>
    apiRequest<OrganizationMetrics>(apiConfig.baseUrl, `/organizations/${orgId}/dashboard`),

  rebuildMetrics: (orgId: string) =>
    apiRequest<OrganizationMetrics>(apiConfig.baseUrl, `/organizations/${orgId}/metrics/rebuild`, {
      method: "POST",
    }),
};
