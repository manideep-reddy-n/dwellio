"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assetsApi } from "@/lib/api/assets";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";
import type { Asset, CreateAssetInput, UpdateAssetInput } from "@/types/api/asset";

export function useAssets(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.assets(orgId) : ["assets", "disabled"],
    queryFn: () => assetsApi.list(orgId!),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.liveOps,
  });
}

export function useAssetMutations(orgId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.assets(orgId) });
  };

  const create = useMutation({
    mutationFn: (input: CreateAssetInput) => assetsApi.create(orgId!, input),
    onSettled: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAssetInput }) =>
      assetsApi.update(orgId!, id, input),
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => assetsApi.delete(orgId!, id),
    onMutate: (id) => {
      if (!orgId) return;
      queryClient.setQueryData<Asset[]>(queryKeys.assets(orgId), (old) =>
        old?.filter((a) => a.id !== id),
      );
    },
    onSettled: invalidate,
  });

  return { create, update, remove };
}
