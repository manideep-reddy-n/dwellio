"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { membershipsApi, rolesApi } from "@/lib/api/memberships";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";
import type { CreateRoleInput, Role, UpdateRoleInput } from "@/types/api/role";

export function useRoles(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.roles(orgId) : ["roles", "disabled"],
    queryFn: () => rolesApi.list(orgId!),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.static,
  });
}

export function useRoleMutations(orgId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.roles(orgId) });
  };

  const create = useMutation({
    mutationFn: (input: CreateRoleInput) => rolesApi.create(orgId!, input),
    onSettled: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoleInput }) =>
      rolesApi.update(orgId!, id, input),
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => rolesApi.delete(orgId!, id),
    onMutate: (id) => {
      if (!orgId) return;
      queryClient.setQueryData<Role[]>(queryKeys.roles(orgId), (old) =>
        old?.filter((r) => r.id !== id),
      );
    },
    onSettled: invalidate,
  });

  return { create, update, remove };
}

export function useInviteStaff(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, roleId }: { email: string; roleId: string }) =>
      membershipsApi.inviteStaff(orgId!, email, roleId),
    onSettled: () => {
      if (!orgId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.memberships(orgId) });
    },
  });
}
