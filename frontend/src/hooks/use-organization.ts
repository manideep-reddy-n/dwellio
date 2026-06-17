"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationsApi } from "@/lib/api/organizations";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";
import { useOrgStore } from "@/stores/org-store";
import type { CreateOrganizationInput, UpdateOrganizationInput } from "@/types/api/organization";

export function useOrganization(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.organizations.detail(orgId) : ["organizations", "disabled"],
    queryFn: () => organizationsApi.get(orgId!),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.static,
  });
}

export function useOrganizationBySlug(slug: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: slug ? queryKeys.organizations.bySlug(slug) : ["organizations", "slug", "disabled"],
    queryFn: () => organizationsApi.getBySlug(slug!),
    enabled: authReady && Boolean(slug),
    staleTime: queryDefaults.staleTime.static,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => organizationsApi.create(input),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.memberships() });
    },
  });
}

export function useUpdateOrganization(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => organizationsApi.update(orgId!, input),
    onSettled: () => {
      if (!orgId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(orgId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(orgId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.complaints.slaSummary(orgId) });
    },
  });
}

export function useUploadOrganizationLogo(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => organizationsApi.uploadLogo(orgId!, file),
    onSuccess: (organization) => {
      if (!orgId) return;
      const active = useOrgStore.getState().activeOrg;
      if (active?.id === orgId) {
        useOrgStore.getState().setActiveOrg({
          ...active,
          logoUrl: organization.logoUrl,
        });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.memberships() });
    },
    onSettled: () => {
      if (!orgId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(orgId) });
    },
  });
}
