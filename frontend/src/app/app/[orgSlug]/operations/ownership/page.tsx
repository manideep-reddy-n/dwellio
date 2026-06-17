"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { OperationsAutoBack } from "@/components/shared/page-back-header";
import { PageTitle } from "@/components/shared/page-title";
import { OwnershipPanel } from "@/components/operations/ownership-panel";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { useOrganization } from "@/hooks/use-organization";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function OwnershipPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data: org } = useOrganization(orgId);

  if (org && org.type !== "GATED_COMMUNITY") {
    return (
      <PageTransition>
        <PageTitle title="Ownership" />
        <OperationsAutoBack orgSlug={orgSlug} />
        <p className="text-sm text-muted-foreground">Ownership records are available for gated communities only.</p>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageTitle title="Ownership" />
      <OperationsAutoBack orgSlug={orgSlug} />
      <OpsGuard permission={PERMISSIONS.BUILDING_MANAGE}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Unit ownership"
          description="Owner details, ownership history, and billing responsibility (V1 — no sale or legal workflows)."
        >
          {orgId && <OwnershipPanel orgId={orgId} />}
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
