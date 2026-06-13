import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type {
  MarketplaceSearchParams,
  PublicOrganizationResponse,
  PublicOrganizationSummary,
  PublicReview,
} from "@/types/api/marketplace";

const base = apiConfig.baseUrl;

function buildSearchQuery(params: MarketplaceSearchParams = {}): string {
  const search = new URLSearchParams();
  if (params.city) search.set("city", params.city);
  if (params.type) search.set("type", params.type);
  if (params.q) search.set("q", params.q);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const marketplaceApi = {
  search: (params?: MarketplaceSearchParams) =>
    apiRequest<PublicOrganizationSummary[]>(
      base,
      `/marketplace/organizations${buildSearchQuery(params)}`,
      { skipAuth: true },
    ),

  getBySlug: (slug: string) =>
    apiRequest<PublicOrganizationResponse>(base, `/marketplace/organizations/${slug}`, {
      skipAuth: true,
    }),

  listReviews: (slug: string) =>
    apiRequest<PublicReview[]>(base, `/marketplace/organizations/${slug}/reviews`, {
      skipAuth: true,
    }),
};
