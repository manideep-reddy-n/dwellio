"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { LiveOpsCenter } from "@/components/operations/live-ops-center";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { usePermissions } from "@/hooks/use-permissions";

export default function LiveOperationsPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";

  return (
    <PageTransition>
      <OpsGuard>
        <OperationsShell
          orgSlug={orgSlug}
          title="Live Operations Center"
          description="Real-time complaints, joins, occupancy, and announcements."
        >
          {orgId && <LiveOpsCenter orgId={orgId} orgSlug={orgSlug} />}
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
