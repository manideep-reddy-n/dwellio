import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";

export interface ResidentProfile {
  organizationSlug: string;
  organizationName: string;
  membershipId: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export const profileApi = {
  getResidentProfile: (slug: string) =>
    apiRequest<ResidentProfile>(apiConfig.baseUrl, `/users/me/resident-profile/${slug}`),

  updateResidentProfile: (
    slug: string,
    body: { emergencyContactName?: string; emergencyContactPhone?: string },
  ) =>
    apiRequest<ResidentProfile>(apiConfig.baseUrl, `/users/me/resident-profile/${slug}`, {
      method: "PATCH",
      body,
    }),
};
