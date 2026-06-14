"use client";

import { useMyMemberships } from "@/hooks/use-memberships";
import { OrgProfileActions } from "@/components/marketplace/org-profile-actions";
import type { PublicOrganizationMetrics } from "@/types/api/marketplace";

interface OrgProfileActionsGatedProps {
  organizationId: string;
  slug: string;
  metrics: PublicOrganizationMetrics;
}

/** Hides join / notify actions when the viewer is already a member. */
export function OrgProfileActionsGated({
  organizationId,
  slug,
  metrics,
}: OrgProfileActionsGatedProps) {
  const { data: memberships = [] } = useMyMemberships();
  const isMember = memberships.some((m) => m.organizationId === organizationId);

  if (isMember) return null;

  return <OrgProfileActions slug={slug} metrics={metrics} />;
}
