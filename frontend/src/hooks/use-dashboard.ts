"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api/dashboard";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";

export function useDashboard(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.dashboard(orgId) : ["dashboard", "disabled"],
    queryFn: () => dashboardApi.get(orgId!),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.dashboard,
  });
}

export function useRebuildMetrics(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dashboardApi.rebuildMetrics(orgId!),
    onSuccess: (data) => {
      if (!orgId) return;
      queryClient.setQueryData(queryKeys.dashboard(orgId), data);
    },
  });
}
