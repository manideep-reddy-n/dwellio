"use client";

import { useQuery } from "@tanstack/react-query";
import { complaintsApi } from "@/lib/api/complaints";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";

export function useComplaintSlaSummary(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.complaints.slaSummary(orgId) : ["complaints", "sla-summary", "disabled"],
    queryFn: () => complaintsApi.slaSummary(orgId!),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.liveOps,
  });
}
