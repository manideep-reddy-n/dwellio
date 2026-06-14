import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { UserMembership } from "@/types/api/membership";

const base = apiConfig.baseUrl;

export const usersApi = {
  listMyMemberships: () =>
    apiRequest<UserMembership[]>(base, "/users/me/memberships"),

  getMyMembershipBySlug: (slug: string) =>
    apiRequest<UserMembership>(base, `/users/me/memberships/by-slug/${slug}`),

  leaveOrganization: (organizationId: string, reason?: string) =>
    apiRequest<{ id: string; status: string }>(
      base,
      `/users/me/memberships/${organizationId}/leave-request`,
      { method: "POST", body: { reason } },
    ),
};
