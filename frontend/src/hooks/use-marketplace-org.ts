"use client";

import { useQuery } from "@tanstack/react-query";
import { marketplaceApi } from "@/lib/api/marketplace";
import { trustInputFromMetrics } from "@/lib/marketplace/format";

export function useMarketplaceOrg(slug: string | undefined) {
  return useQuery({
    queryKey: ["marketplace", "org", slug],
    queryFn: () => marketplaceApi.getBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}

export function useTrustInputForOrg(slug: string | undefined) {
  const query = useMarketplaceOrg(slug);
  const trustInput = query.data ? trustInputFromMetrics(query.data.metrics, query.data.verified) : null;
  return { ...query, trustInput };
}
