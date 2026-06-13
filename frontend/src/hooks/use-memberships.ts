"use client";

import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";

export function useMyMemberships() {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: queryKeys.me.memberships(),
    queryFn: () => usersApi.listMyMemberships(),
    enabled: authReady,
    staleTime: queryDefaults.staleTime.static,
  });
}

export function useMyMembershipBySlug(slug: string) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: queryKeys.me.membershipBySlug(slug),
    queryFn: () => usersApi.getMyMembershipBySlug(slug),
    staleTime: queryDefaults.staleTime.static,
    enabled: authReady && Boolean(slug),
  });
}
