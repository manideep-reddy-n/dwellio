"use client";

import { useOrgStore } from "@/stores/org-store";
import { hasPermission } from "@/lib/permissions/evaluate";

export function usePermissions() {
  const activeOrg = useOrgStore((s) => s.activeOrg);

  const permissions = activeOrg?.permissions ?? [];
  const isOwner = activeOrg?.isOwner ?? false;

  return {
    activeOrg,
    permissions,
    isOwner,
    can: (code: string) => hasPermission(permissions, isOwner, code),
  };
}
