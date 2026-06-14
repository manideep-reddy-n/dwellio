import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";

export interface SuspensionAppeal {
  id: string;
  organizationId: string;
  reason: string;
  status: "PENDING" | "REVIEWED" | "DISMISSED";
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export const suspensionAppealApi = {
  getPending: (orgId: string) =>
    apiRequest<SuspensionAppeal | null>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/suspension-appeals/pending`,
    ),

  submit: (orgId: string, reason: string) =>
    apiRequest<SuspensionAppeal>(apiConfig.baseUrl, `/organizations/${orgId}/suspension-appeals`, {
      method: "POST",
      body: { reason },
    }),

  list: (orgId: string) =>
    apiRequest<SuspensionAppeal[]>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/suspension-appeals`,
    ),
};
