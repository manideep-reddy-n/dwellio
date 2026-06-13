import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { Asset, CreateAssetInput, UpdateAssetInput } from "@/types/api/asset";

export const assetsApi = {
  list: (orgId: string) =>
    apiRequest<Asset[]>(apiConfig.baseUrl, `/organizations/${orgId}/assets`),

  get: (orgId: string, assetId: string) =>
    apiRequest<Asset>(apiConfig.baseUrl, `/organizations/${orgId}/assets/${assetId}`),

  create: (orgId: string, body: CreateAssetInput) =>
    apiRequest<Asset>(apiConfig.baseUrl, `/organizations/${orgId}/assets`, {
      method: "POST",
      body,
    }),

  update: (orgId: string, assetId: string, body: UpdateAssetInput) =>
    apiRequest<Asset>(apiConfig.baseUrl, `/organizations/${orgId}/assets/${assetId}`, {
      method: "PATCH",
      body,
    }),

  delete: (orgId: string, assetId: string) =>
    apiRequest<void>(apiConfig.baseUrl, `/organizations/${orgId}/assets/${assetId}`, {
      method: "DELETE",
    }),
};
