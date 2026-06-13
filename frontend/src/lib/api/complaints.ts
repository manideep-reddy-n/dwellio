import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { Complaint, CreateComplaintInput } from "@/types/api/complaint";
import type { ComplaintCategory } from "@/types/enums";

export const complaintsApi = {
  listAll: (orgId: string, category?: ComplaintCategory) => {
    const params = category ? `?category=${category}` : "";
    return apiRequest<Complaint[]>(apiConfig.baseUrl, `/organizations/${orgId}/complaints${params}`);
  },

  listMine: (orgId: string, category?: ComplaintCategory) => {
    const params = category ? `?category=${category}` : "";
    return apiRequest<Complaint[]>(apiConfig.baseUrl, `/organizations/${orgId}/complaints/mine${params}`);
  },

  get: (orgId: string, complaintId: string) =>
    apiRequest<Complaint>(apiConfig.baseUrl, `/organizations/${orgId}/complaints/${complaintId}`),

  create: (orgId: string, body: CreateComplaintInput) =>
    apiRequest<Complaint>(apiConfig.baseUrl, `/organizations/${orgId}/complaints`, {
      method: "POST",
      body,
    }),

  assign: (orgId: string, complaintId: string, assigneeMembershipId: string) =>
    apiRequest<Complaint>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/complaints/${complaintId}/assign`,
      { method: "POST", body: { assigneeMembershipId } },
    ),

  start: (orgId: string, complaintId: string) =>
    apiRequest<Complaint>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/complaints/${complaintId}/start`,
      { method: "POST" },
    ),

  resolve: (orgId: string, complaintId: string) =>
    apiRequest<Complaint>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/complaints/${complaintId}/resolve`,
      { method: "POST" },
    ),

  close: (orgId: string, complaintId: string) =>
    apiRequest<Complaint>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/complaints/${complaintId}/close`,
      { method: "POST" },
    ),

  reopen: (orgId: string, complaintId: string) =>
    apiRequest<Complaint>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/complaints/${complaintId}/reopen`,
      { method: "POST" },
    ),

  delete: (orgId: string, complaintId: string) =>
    apiRequest<void>(apiConfig.baseUrl, `/organizations/${orgId}/complaints/${complaintId}`, {
      method: "DELETE",
    }),
};
