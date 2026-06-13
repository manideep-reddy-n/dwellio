import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { OrgMembership } from "@/types/api/membership";
import type { Role } from "@/types/api/role";

export interface StaffInviteResult {
  status: string;
  message: string;
  membership: OrgMembership | null;
}

export const membershipsApi = {
  list: (orgId: string) =>
    apiRequest<OrgMembership[]>(apiConfig.baseUrl, `/organizations/${orgId}/memberships`),

  inviteStaff: (orgId: string, email: string, roleId: string) =>
    apiRequest<StaffInviteResult>(apiConfig.baseUrl, `/organizations/${orgId}/staff/invite`, {
      method: "POST",
      body: { email, roleId },
    }),
};

export const rolesApi = {
  list: (orgId: string) =>
    apiRequest<Role[]>(apiConfig.baseUrl, `/organizations/${orgId}/roles`),

  create: (orgId: string, body: { name: string; permissions: string[] }) =>
    apiRequest<Role>(apiConfig.baseUrl, `/organizations/${orgId}/roles`, {
      method: "POST",
      body,
    }),

  update: (orgId: string, roleId: string, body: { name?: string; permissions?: string[] }) =>
    apiRequest<Role>(apiConfig.baseUrl, `/organizations/${orgId}/roles/${roleId}`, {
      method: "PUT",
      body,
    }),

  delete: (orgId: string, roleId: string) =>
    apiRequest<void>(apiConfig.baseUrl, `/organizations/${orgId}/roles/${roleId}`, {
      method: "DELETE",
    }),
};
