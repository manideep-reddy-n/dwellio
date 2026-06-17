"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { joinRequestsApi } from "@/lib/api/join-requests";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";
import type { JoinRequest } from "@/types/api/join-request";

export function useJoinRequests(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.joinRequests(orgId) : ["join-requests", "disabled"],
    queryFn: () => joinRequestsApi.list(orgId!),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.liveOps,
    select: (data) =>
      [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  });
}

export function useJoinRequestActions(orgId: string | undefined) {
  const queryClient = useQueryClient();

  const patch = (id: string, status: JoinRequest["status"], extra?: Partial<JoinRequest>) => {
    if (!orgId) return;
    const key = queryKeys.joinRequests(orgId);
    queryClient.setQueryData<JoinRequest[]>(key, (old) =>
      old?.map((r) => (r.id === id ? { ...r, status, ...extra } : r)),
    );
  };

  const invalidate = () => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.joinRequests(orgId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.memberships(orgId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(orgId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.liveOps(orgId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.timeline(orgId) });
  };

  const approve = useMutation({
    mutationFn: (joinRequestId: string) => joinRequestsApi.approve(orgId!, joinRequestId),
    onMutate: (id) => patch(id, "APPROVED", { reviewedAt: new Date().toISOString() }),
    onSettled: invalidate,
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      joinRequestsApi.reject(orgId!, id, reason),
    onMutate: ({ id, reason }) =>
      patch(id, "REJECTED", {
        reviewedAt: new Date().toISOString(),
        rejectionReason: reason ?? null,
      }),
    onSettled: invalidate,
  });

  return { approve, reject };
}
