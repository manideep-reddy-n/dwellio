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

  uploadLogo: async (orgId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const { useAuthStore } = await import("@/stores/auth-store");
    const token = useAuthStore.getState().accessToken;
    const response = await fetch(`${apiConfig.baseUrl}/organizations/${orgId}/logo`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message =
        typeof payload === "object" && payload !== null && "message" in payload
          ? String((payload as { message: unknown }).message)
          : "Upload failed";
      throw new Error(message);
    }
    return response.json() as Promise<Organization>;
  },
};

export interface OrganizationImage {
  id: string;
  url: string;
  caption: string | null;
  sortOrder: number;
}

export const organizationImagesApi = {
  list: (orgId: string) =>
    apiRequest<OrganizationImage[]>(apiConfig.baseUrl, `/organizations/${orgId}/images`),

  upload: async (orgId: string, file: File, caption?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (caption) form.append("caption", caption);
    const { useAuthStore } = await import("@/stores/auth-store");
    const token = useAuthStore.getState().accessToken;
    const response = await fetch(`${apiConfig.baseUrl}/organizations/${orgId}/images`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!response.ok) throw new Error("Upload failed");
    return response.json() as Promise<OrganizationImage>;
  },

  delete: (orgId: string, imageId: string) =>
    apiRequest<void>(apiConfig.baseUrl, `/organizations/${orgId}/images/${imageId}`, {
      method: "DELETE",
    }),
};
