import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";

export interface LeaveRequest {
  id: string;
  membershipId: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export const leaveRequestsApi = {
  list: (orgId: string) =>
    apiRequest<LeaveRequest[]>(apiConfig.baseUrl, `/organizations/${orgId}/leave-requests`),

  approve: (orgId: string, leaveRequestId: string) =>
    apiRequest<LeaveRequest>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/leave-requests/${leaveRequestId}/approve`,
      { method: "POST" },
    ),

  reject: (orgId: string, leaveRequestId: string) =>
    apiRequest<LeaveRequest>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/leave-requests/${leaveRequestId}/reject`,
      { method: "POST" },
    ),
};
