import { apiConfig } from "@/config/api";
import type {
  MarketplaceSearchParams,
  PublicOrganizationResponse,
  PublicOrganizationSummary,
  PublicReview,
} from "@/types/api/marketplace";

function buildSearchQuery(params: MarketplaceSearchParams = {}): string {
  const search = new URLSearchParams();
  if (params.city) search.set("city", params.city);
  if (params.type) search.set("type", params.type);
  if (params.q) search.set("q", params.q);
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function marketplaceFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Marketplace request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchMarketplaceOrgs(params?: MarketplaceSearchParams) {
  return marketplaceFetch<PublicOrganizationSummary[]>(
    `/marketplace/organizations${buildSearchQuery(params)}`,
  );
}

export async function fetchMarketplaceOrg(slug: string) {
  return marketplaceFetch<PublicOrganizationResponse>(`/marketplace/organizations/${slug}`);
}

export async function fetchMarketplaceReviews(slug: string) {
  return marketplaceFetch<PublicReview[]>(`/marketplace/organizations/${slug}/reviews`);
}
