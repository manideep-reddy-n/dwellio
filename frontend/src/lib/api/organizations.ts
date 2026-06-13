import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type {
  CreateOrganizationInput,
  Organization,
  UpdateOrganizationInput,
} from "@/types/api/organization";

export const organizationsApi = {
  create: (body: CreateOrganizationInput) =>
    apiRequest<Organization>(apiConfig.baseUrl, "/organizations", {
      method: "POST",
      body,
    }),

  get: (orgId: string) =>
    apiRequest<Organization>(apiConfig.baseUrl, `/organizations/${orgId}`),

  getBySlug: (slug: string) =>
    apiRequest<Organization>(apiConfig.baseUrl, `/organizations/by-slug/${slug}`),

  update: (orgId: string, body: UpdateOrganizationInput) =>
    apiRequest<Organization>(apiConfig.baseUrl, `/organizations/${orgId}`, {
      method: "PATCH",
      body,
    }),

  updateBySlug: (slug: string, body: UpdateOrganizationInput) =>
    apiRequest<Organization>(apiConfig.baseUrl, `/organizations/by-slug/${slug}`, {
      method: "PATCH",
      body,
    }),
};
