import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { ResidentLifecycleProfile } from "@/types/api/resident-lifecycle";

export const residentsApi = {
  profile: (orgId: string, membershipId: string) =>
    apiRequest<ResidentLifecycleProfile>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/residents/${membershipId}/profile`,
    ),
};
