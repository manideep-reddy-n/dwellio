import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { JoinRequest } from "@/types/api/join-request";

export const joinRequestsApi = {
  submit: (orgId: string, input?: string | { message?: string }) => {
    const message = typeof input === "string" ? input : input?.message;
    return apiRequest<JoinRequest>(apiConfig.baseUrl, `/organizations/${orgId}/join-requests`, {
      method: "POST",
      body: message ? { message } : {},
    });
  },

  list: (orgId: string) =>
    apiRequest<JoinRequest[]>(apiConfig.baseUrl, `/organizations/${orgId}/join-requests`),

  approve: (orgId: string, joinRequestId: string) =>
    apiRequest<JoinRequest>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/join-requests/${joinRequestId}/approve`,
      { method: "POST" },
    ),

  reject: (orgId: string, joinRequestId: string, reason?: string) =>
    apiRequest<JoinRequest>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/join-requests/${joinRequestId}/reject`,
      {
        method: "POST",
        body: reason ? { reason } : {},
      },
    ),
};

/** @deprecated Use joinRequestsApi */
export const joinRequestApi = joinRequestsApi;
