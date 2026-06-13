"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { reviewsApi } from "@/lib/api/reviews";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";
import { useAuthReady } from "@/hooks/use-auth-ready";
import type { CreateReviewInput, Review, UpdateReviewInput } from "@/types/api/review";

export function useMyReview(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.reviews.mine(orgId) : ["reviews", "mine", "disabled"],
    queryFn: async () => {
      try {
        return await reviewsApi.getMine(orgId!);
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

export function useCreateReview(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewInput) => reviewsApi.create(orgId!, input),
    onSuccess: (review) => {
      if (!orgId) return;
      queryClient.setQueryData<Review | null>(queryKeys.reviews.mine(orgId), review);
    },
  });
}

export function useUpdateReview(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateReviewInput) => reviewsApi.updateMine(orgId!, input),
    onMutate: async (input) => {
      if (!orgId) return;
      const key = queryKeys.reviews.mine(orgId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Review | null>(key);
      if (previous) {
        const optimistic: Review = {
          ...previous,
          rating: input.rating,
          body: input.body,
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData<Review | null>(key, optimistic);
      }
      return { previous, key };
    },
    onError: (_err, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: () => {
      if (!orgId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.mine(orgId) });
    },
  });
}
