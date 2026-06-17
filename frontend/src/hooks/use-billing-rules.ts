"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { billingRulesApi, type UpsertBillingRuleInput } from "@/lib/api/billing-rules";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";

export function useBillingRules(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.billingRules(orgId) : ["billing-rules", "disabled"],
    queryFn: () => billingRulesApi.list(orgId!),
    enabled: authReady && Boolean(orgId),
  });
}

export function useUpsertBillingRule(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertBillingRuleInput) => billingRulesApi.upsert(orgId!, input),
    onSettled: () => {
      if (!orgId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.billingRules(orgId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments(orgId) });
    },
  });
}
