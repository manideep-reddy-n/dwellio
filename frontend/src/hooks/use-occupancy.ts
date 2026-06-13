"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { occupanciesApi } from "@/lib/api/accommodation";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";

import { useAuthReady } from "@/hooks/use-auth-ready";

export function useMyOccupancy(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.occupancies.mine(orgId) : ["occupancies", "mine", "disabled"],
    queryFn: async () => {
      try {
        return await occupanciesApi.getMine(orgId!);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.dashboard,
  });
}
