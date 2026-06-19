"use client";

import { useQuery } from "@tanstack/react-query";
import { membershipsApi } from "@/lib/api/memberships";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";

export function useOrgMemberships(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.memberships(orgId) : ["memberships", "disabled"],
    queryFn: () => membershipsApi.list(orgId!),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.liveOps,
    select: (data) =>
      [...data].sort((a, b) =>
        (a.userFullName ?? a.userEmail).localeCompare(b.userFullName ?? b.userEmail),
      ),
  });
}

export function useResidents(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? [...queryKeys.memberships(orgId), "residents"] : ["residents", "disabled"],
    queryFn: () => membershipsApi.listResidents(orgId!),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.liveOps,
    select: (data) =>
      [...data].sort((a, b) =>
        (a.userFullName ?? a.userEmail).localeCompare(b.userFullName ?? b.userEmail),
      ),
  });
}

export function useStaffMembers(orgId: string | undefined) {
  const query = useOrgMemberships(orgId);
  return {
    ...query,
    data: query.data?.filter((m) => m.roleName.toLowerCase() !== "resident"),
  };
}
