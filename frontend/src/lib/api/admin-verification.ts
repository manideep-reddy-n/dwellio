import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import { getAdminSession } from "@/lib/auth/admin-session";
import type {
  AdminVerificationRequestSummary,
  VerificationRequest,
  VerificationRequestStatus,
} from "@/lib/api/verification";

function adminRequest<T>(path: string, options: Parameters<typeof apiRequest>[2] = {}) {
  const token = getAdminSession()?.accessToken ?? null;
  return apiRequest<T>(apiConfig.baseUrl, path, { ...options, token });
}

export const adminVerificationApi = {
  list: (params?: { status?: VerificationRequestStatus; q?: string }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.q) search.set("q", params.q);
    const query = search.toString();
    return adminRequest<AdminVerificationRequestSummary[]>(
      `/admin/verification-requests${query ? `?${query}` : ""}`,
    );
  },

  getById: (requestId: string) =>
    adminRequest<VerificationRequest>(`/admin/verification-requests/${requestId}`),

  approve: (requestId: string) =>
    adminRequest<VerificationRequest>(`/admin/verification-requests/${requestId}/approve`, {
      method: "POST",
    }),

  reject: (requestId: string, reason: string) =>
    adminRequest<VerificationRequest>(`/admin/verification-requests/${requestId}/reject`, {
      method: "POST",
      body: { reason },
    }),

  requestMoreInfo: (requestId: string, notes: string) =>
    adminRequest<VerificationRequest>(
      `/admin/verification-requests/${requestId}/request-more-info`,
      { method: "POST", body: { notes } },
    ),
};
