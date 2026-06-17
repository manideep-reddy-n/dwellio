"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { revenueApi } from "@/lib/api/revenue";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";

export function useRevenueSummary(orgId: string | undefined) {
  const { authReady } = useAuthReady();
  return useQuery({
    queryKey: orgId ? queryKeys.revenue(orgId) : ["revenue", "disabled"],
    queryFn: () => revenueApi.summary(orgId!),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.dashboard,
  });
}

export function useDefaulters(orgId: string | undefined) {
  const { authReady } = useAuthReady();
  return useQuery({
    queryKey: orgId ? [...queryKeys.revenue(orgId), "defaulters"] : ["defaulters", "disabled"],
    queryFn: () => revenueApi.defaulters(orgId!),
    enabled: authReady && Boolean(orgId),
  });
}

export function useRefreshRevenue(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => revenueApi.refresh(orgId!),
    onSuccess: (data) => {
      if (orgId) {
        queryClient.setQueryData(queryKeys.revenue(orgId), data);
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(orgId) });
      }
    },
  });
}
