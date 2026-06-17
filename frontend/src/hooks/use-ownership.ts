"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ownershipApi, type CreateOwnershipInput } from "@/lib/api/ownership";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";

export function useOwnershipRecords(orgId: string | undefined, unitSpaceId?: string) {
  const { authReady } = useAuthReady();
  return useQuery({
    queryKey: orgId ? [...queryKeys.ownership(orgId), unitSpaceId ?? "all"] : ["ownership", "disabled"],
    queryFn: () => ownershipApi.list(orgId!, unitSpaceId),
    enabled: authReady && Boolean(orgId),
  });
}

export function useCreateOwnershipRecord(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOwnershipInput) => ownershipApi.create(orgId!, body),
    onSettled: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.ownership(orgId) });
    },
  });
}
