"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { complaintsApi } from "@/lib/api/complaints";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";
import type { Complaint } from "@/types/api/complaint";
import type { ComplaintCategory } from "@/types/enums";

export function useOrgComplaints(orgId: string | undefined, category?: ComplaintCategory) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.complaints.all(orgId, category ? { category } : {}) : ["complaints", "disabled"],
    queryFn: () => complaintsApi.listAll(orgId!, category),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.liveOps,
  });
}

function patchComplaintInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string,
  complaintId: string,
  patch: Partial<Complaint> | ((c: Complaint) => Complaint),
) {
  const key = queryKeys.complaints.all(orgId);
  queryClient.setQueryData<Complaint[]>(key, (old) =>
    old?.map((c) => {
      if (c.id !== complaintId) return c;
      return typeof patch === "function" ? patch(c) : { ...c, ...patch };
    }),
  );
}

export function useComplaintWorkflow(orgId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.complaints.all(orgId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(orgId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.liveOps(orgId) });
  };

  const optimisticStatus = (complaintId: string, status: Complaint["status"]) => {
    if (!orgId) return;
    patchComplaintInCache(queryClient, orgId, complaintId, {
      status,
      updatedAt: new Date().toISOString(),
    });
  };

  const assign = useMutation({
    mutationFn: ({ complaintId, assigneeMembershipId }: { complaintId: string; assigneeMembershipId: string }) =>
      complaintsApi.assign(orgId!, complaintId, assigneeMembershipId),
    onMutate: async ({ complaintId, assigneeMembershipId }) => {
      if (!orgId) return;
      const key = queryKeys.complaints.all(orgId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Complaint[]>(key);
      patchComplaintInCache(queryClient, orgId, complaintId, {
        assignedToMembershipId: assigneeMembershipId,
        assignedAt: new Date().toISOString(),
      });
      return { previous, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ctx.key, ctx.previous);
    },
    onSettled: invalidate,
  });

  const start = useMutation({
    mutationFn: (complaintId: string) => complaintsApi.start(orgId!, complaintId),
    onMutate: (complaintId) => optimisticStatus(complaintId, "IN_PROGRESS"),
    onSettled: invalidate,
  });

  const resolve = useMutation({
    mutationFn: (complaintId: string) => complaintsApi.resolve(orgId!, complaintId),
    onMutate: (complaintId) => optimisticStatus(complaintId, "RESOLVED"),
    onSettled: invalidate,
  });

  const close = useMutation({
    mutationFn: (complaintId: string) => complaintsApi.close(orgId!, complaintId),
    onMutate: (complaintId) => optimisticStatus(complaintId, "CLOSED"),
    onSettled: invalidate,
  });

  const reopen = useMutation({
    mutationFn: (complaintId: string) => complaintsApi.reopen(orgId!, complaintId),
    onMutate: (complaintId) => optimisticStatus(complaintId, "REOPENED"),
    onSettled: invalidate,
  });

  return { assign, start, resolve, close, reopen };
}
