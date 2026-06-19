import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { AccommodationVisualization, StaffOccupancy } from "@/types/api/accommodation";
import type { OrgMembership } from "@/types/api/membership";
import type { OrganizationStatus, OrganizationType } from "@/types/enums";

export interface AdminOrganization {
  id: string;
  slug: string;
  name: string;
  type: OrganizationType;
  status: OrganizationStatus;
  city: string;
  area: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  defaultMonthlyRent: number | null;
  logoUrl: string | null;
  activeResidentCount: number;
  createdAt: string;
  verifiedAt: string | null;
  rejectionReason: string | null;
}

export interface AdminSuspensionAppeal {
  id: string;
  organizationId: string;
  reason: string;
  status: "PENDING" | "REVIEWED" | "DISMISSED";
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

function adminRequest<T>(path: string, options: Parameters<typeof apiRequest>[2] = {}) {
  return apiRequest<T>(apiConfig.baseUrl, path, options);
}

export const adminApi = {
  listOrganizations: (status?: OrganizationStatus) =>
    adminRequest<AdminOrganization[]>(
      `/admin/organizations${status ? `?status=${status}` : ""}`,
    ),

  getOrganization: (orgId: string) =>
    adminRequest<AdminOrganization>(`/admin/organizations/${orgId}`),

  verifyOrganization: (orgId: string) =>
    adminRequest<AdminOrganization>(`/admin/organizations/${orgId}/verify`, { method: "POST" }),

  rejectOrganization: (orgId: string, reason: string) =>
    adminRequest<AdminOrganization>(`/admin/organizations/${orgId}/reject`, {
      method: "POST",
      body: { reason },
    }),

  suspendOrganization: (orgId: string) =>
    adminRequest<AdminOrganization>(`/admin/organizations/${orgId}/suspend`, { method: "POST" }),

  unsuspendOrganization: (orgId: string) =>
    adminRequest<AdminOrganization>(`/admin/organizations/${orgId}/unsuspend`, { method: "POST" }),

  listMembers: (orgId: string) =>
    adminRequest<OrgMembership[]>(`/admin/organizations/${orgId}/members`),

  listResidents: (orgId: string) =>
    adminRequest<OrgMembership[]>(`/admin/organizations/${orgId}/residents`),

  visualization: (orgId: string) =>
    adminRequest<AccommodationVisualization>(
      `/admin/organizations/${orgId}/accommodation/visualization`,
    ),

  listOccupancies: (orgId: string) =>
    adminRequest<StaffOccupancy[]>(`/admin/organizations/${orgId}/occupancies`),

  listAppeals: (orgId: string) =>
    adminRequest<AdminSuspensionAppeal[]>(`/admin/organizations/${orgId}/suspension-appeals`),

  reviewAppeal: (orgId: string, appealId: string, notes: string) =>
    adminRequest<AdminSuspensionAppeal>(
      `/admin/organizations/${orgId}/suspension-appeals/${appealId}/review`,
      { method: "POST", body: { notes } },
    ),
};
