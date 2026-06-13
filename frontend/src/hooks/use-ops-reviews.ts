"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewsApi } from "@/lib/api/reviews";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";

export function useOrgReviews(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.reviews.list(orgId) : ["reviews", "disabled"],
    queryFn: () => reviewsApi.list(orgId!),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.liveOps,
    select: (data) =>
      [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  });
}

export function useReportReview(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, reason }: { reviewId: string; reason: string }) =>
      reviewsApi.report(orgId!, reviewId, reason),
    onSettled: () => {
      if (!orgId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.list(orgId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(orgId) });
    },
  });
}
