import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { Complaint, CreateComplaintInput } from "@/types/api/complaint";
import type { ComplaintSlaSummary } from "@/types/api/complaint-sla";
import type { ComplaintCategory } from "@/types/enums";

function buildComplaintQuery(params: { category?: ComplaintCategory; slaBreach?: boolean }) {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.slaBreach === true) search.set("slaBreach", "true");
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const complaintsApi = {
  listAll: (orgId: string, filters?: { category?: ComplaintCategory; slaBreach?: boolean }) => {
    const params = buildComplaintQuery(filters ?? {});
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

  slaSummary: (orgId: string) =>
    apiRequest<ComplaintSlaSummary>(apiConfig.baseUrl, `/organizations/${orgId}/complaints/sla-summary`),
};
