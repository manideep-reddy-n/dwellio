import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";

export type ActivityEventCategory =
  | "BILLING"
  | "ACCOMMODATION"
  | "COMPLAINT"
  | "REVIEW"
  | "MEMBERSHIP";

export interface ActivityEvent {
  id: string;
  membershipId: string | null;
  residentName: string | null;
  eventCategory: ActivityEventCategory;
  eventType: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

export const timelineApi = {
  list: (orgId: string, membershipId?: string) => {
    const qs = membershipId ? `?membershipId=${membershipId}` : "";
    return apiRequest<ActivityEvent[]>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/timeline${qs}`,
    );
  },

  listMine: (orgId: string) =>
    apiRequest<ActivityEvent[]>(apiConfig.baseUrl, `/organizations/${orgId}/timeline/mine`),
};
