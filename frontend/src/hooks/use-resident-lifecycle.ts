"use client";

import { useQuery } from "@tanstack/react-query";
import { residentsApi } from "@/lib/api/residents";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";

export function useResidentLifecycleProfile(orgId: string | undefined, membershipId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey:
      orgId && membershipId
        ? queryKeys.residentProfile(orgId, membershipId)
        : ["resident-profile", "disabled"],
    queryFn: () => residentsApi.profile(orgId!, membershipId!),
    enabled: authReady && Boolean(orgId && membershipId),
    staleTime: queryDefaults.staleTime.liveOps,
  });
}
