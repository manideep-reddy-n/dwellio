"use client";

import { useQuery } from "@tanstack/react-query";
import { ledgerApi } from "@/lib/api/ledger";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";

export function useLedger(orgId: string | undefined, membershipId?: string) {
  const { authReady } = useAuthReady();
  return useQuery({
    queryKey: orgId ? queryKeys.ledger(orgId, membershipId) : ["ledger", "disabled"],
    queryFn: () => ledgerApi.list(orgId!, membershipId),
    enabled: authReady && Boolean(orgId),
  });
}

export function useMyLedger(orgId: string | undefined) {
  const { authReady } = useAuthReady();
  return useQuery({
    queryKey: orgId ? [...queryKeys.ledger(orgId), "mine"] : ["ledger", "mine", "disabled"],
    queryFn: () => ledgerApi.listMine(orgId!),
    enabled: authReady && Boolean(orgId),
  });
}
