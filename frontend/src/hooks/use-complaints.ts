"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintsApi } from "@/lib/api/complaints";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";
import type { Complaint, CreateComplaintInput } from "@/types/api/complaint";
import type { ComplaintCategory } from "@/types/enums";

export function useMyComplaints(orgId: string | undefined, category?: ComplaintCategory) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.complaints.mine(orgId) : ["complaints", "mine", "disabled"],
    queryFn: () => complaintsApi.listMine(orgId!),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.liveOps,
    select: (data) =>
      category ? data.filter((c) => c.category === category) : data,
  });
}

export function useCreateComplaint(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateComplaintInput) => complaintsApi.create(orgId!, input),
    onMutate: async (input) => {
      if (!orgId) return;
      const key = queryKeys.complaints.mine(orgId);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<Complaint[]>(key);
      const optimistic: Complaint = {
        id: `optimistic-${Date.now()}`,
        organizationId: orgId,
        createdByMembershipId: "",
        assignedToMembershipId: null,
        assetId: input.assetId ?? null,
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority ?? "MEDIUM",
        status: "OPEN",
        resolvedAt: null,
        closedAt: null,
        assignedAt: null,
        firstResponseAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: [],
      };

      queryClient.setQueryData<Complaint[]>(key, (old) => [optimistic, ...(old ?? [])]);
      return { previous, key };
    },
    onError: (_err, _input, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSuccess: () => {
      if (!orgId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.complaints.mine(orgId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.resident.home(orgId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeline(orgId) });
    },
    onSettled: () => {
      if (!orgId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.complaints.mine(orgId) });
    },
  });
}
