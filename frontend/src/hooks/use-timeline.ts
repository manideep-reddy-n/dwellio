"use client";

import { useQuery } from "@tanstack/react-query";
import { timelineApi } from "@/lib/api/timeline";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";

export function useTimeline(orgId: string | undefined, membershipId?: string) {
  const { authReady } = useAuthReady();
  return useQuery({
    queryKey: orgId ? queryKeys.timeline(orgId, membershipId) : ["timeline", "disabled"],
    queryFn: () => timelineApi.list(orgId!, membershipId),
    enabled: authReady && Boolean(orgId),
  });
}

export function useMyTimeline(orgId: string | undefined) {
  const { authReady } = useAuthReady();
  return useQuery({
    queryKey: orgId ? [...queryKeys.timeline(orgId), "mine"] : ["timeline", "mine", "disabled"],
    queryFn: () => timelineApi.listMine(orgId!),
    enabled: authReady && Boolean(orgId),
  });
}
