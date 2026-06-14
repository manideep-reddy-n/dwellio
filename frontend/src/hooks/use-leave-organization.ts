"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
import { queryKeys } from "@/lib/query/keys";
import { useOrgStore } from "@/stores/org-store";

export function useLeaveOrganization() {
  const queryClient = useQueryClient();
  const clearActiveOrg = useOrgStore((s) => s.clearActiveOrg);

  return useMutation({
    mutationFn: ({ organizationId, reason }: { organizationId: string; reason?: string }) =>
      usersApi.leaveOrganization(organizationId, reason),
    onSuccess: () => {
      clearActiveOrg();
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.memberships() });
    },
  });
}
