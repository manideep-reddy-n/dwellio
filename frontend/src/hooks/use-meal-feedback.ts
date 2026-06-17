"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mealFeedbackApi } from "@/lib/api/meal-feedback";
import type { MealType } from "@/lib/api/food-menu";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";

export function useMyMealFeedback(orgId: string | undefined, date?: string) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.mealFeedback.mine(orgId, date) : ["meal-feedback", "disabled"],
    queryFn: () => mealFeedbackApi.listMine(orgId!, date),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.liveOps,
  });
}

export function useMealFeedbackSummary(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.mealFeedback.summary(orgId) : ["meal-feedback", "summary", "disabled"],
    queryFn: () => mealFeedbackApi.summary(orgId!),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.liveOps,
  });
}

export function useUpsertMealFeedback(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { mealType: MealType; rating: number; comment?: string }) =>
      mealFeedbackApi.upsert(orgId!, input),
    onSettled: () => {
      if (!orgId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.mealFeedback.mine(orgId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.mealFeedback.summary(orgId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(orgId) });
    },
  });
}
