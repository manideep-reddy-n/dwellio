import { apiRequest } from "@/lib/api/client";
import { apiConfig } from "@/config/api";

const base = apiConfig.baseUrl;

export interface AvailabilityAlert {
  id: string;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  status: "PENDING" | "NOTIFIED" | "CANCELLED";
  createdAt: string;
  notifiedAt: string | null;
}

export const availabilityAlertsApi = {
  status: (slug: string) =>
    apiRequest<{ subscribed: boolean }>(base, `/availability-alerts/${slug}/status`),

  subscribe: (slug: string) =>
    apiRequest<AvailabilityAlert>(base, `/availability-alerts/${slug}`, { method: "POST" }),

  unsubscribe: (slug: string) =>
    apiRequest<void>(base, `/availability-alerts/${slug}`, { method: "DELETE" }),

  list: () => apiRequest<AvailabilityAlert[]>(base, "/availability-alerts"),
};
