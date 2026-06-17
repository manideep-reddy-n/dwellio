"use client";

import { useQuery } from "@tanstack/react-query";
import { occupanciesApi } from "@/lib/api/accommodation";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";

export function useAccommodationHistory(orgId: string | undefined, membershipId?: string) {
  const { authReady } = useAuthReady();
  return useQuery({
    queryKey: orgId ? queryKeys.accommodationHistory(orgId, membershipId) : ["accommodation-history", "disabled"],
    queryFn: () => occupanciesApi.listHistory(orgId!, membershipId),
    enabled: authReady && Boolean(orgId),
  });
}

export function useMyAccommodationHistory(orgId: string | undefined) {
  const { authReady } = useAuthReady();
  return useQuery({
    queryKey: orgId ? [...queryKeys.accommodationHistory(orgId), "mine"] : ["accommodation-history", "mine", "disabled"],
    queryFn: () => occupanciesApi.listMyHistory(orgId!),
    enabled: authReady && Boolean(orgId),
  });
}
