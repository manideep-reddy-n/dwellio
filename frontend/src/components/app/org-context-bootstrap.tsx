"use client";

import { useEffect, useRef } from "react";
import { useMyMemberships } from "@/hooks/use-memberships";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { membershipToOrgContext } from "@/lib/org/context";
import { useOrgStore } from "@/stores/org-store";

function samePermissions(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort().join(",");
  const right = [...b].sort().join(",");
  return left === right;
}

/**
 * Reconciles persisted activeOrg with the server membership list after auth is ready.
 */
export function OrgContextBootstrap() {
  const { authReady } = useAuthReady();
  const { data: memberships } = useMyMemberships();
  const activeOrg = useOrgStore((s) => s.activeOrg);
  const setActiveOrg = useOrgStore((s) => s.setActiveOrg);
  const reconciledRef = useRef(false);

  useEffect(() => {
    if (!authReady || !memberships?.length) return;

    const current = activeOrg
      ? memberships.find((m) => m.organizationId === activeOrg.id)
      : undefined;

    const target = current ?? memberships[0];
    const next = membershipToOrgContext(target);

    if (
      activeOrg &&
      activeOrg.id === next.id &&
      activeOrg.slug === next.slug &&
      activeOrg.name === next.name &&
      activeOrg.organizationType === next.organizationType &&
      activeOrg.logoUrl === next.logoUrl &&
      activeOrg.isOwner === next.isOwner &&
      samePermissions(activeOrg.permissions, next.permissions)
    ) {
      reconciledRef.current = true;
      return;
    }

    if (!reconciledRef.current || !activeOrg || !current) {
      setActiveOrg(next);
      reconciledRef.current = true;
    }
  }, [authReady, memberships, activeOrg, setActiveOrg]);

  return null;
}
