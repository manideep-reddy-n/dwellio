"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { LeaveRequestsPanel } from "@/components/operations/leave-requests-panel";
import { ResidentTable } from "@/components/operations/resident-table";
import { useResidents } from "@/hooks/use-residents";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function ResidentsPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data, isLoading, isError, refetch } = useResidents(orgId);

  return (
    <PageTransition>
      <OpsGuard permission={PERMISSIONS.RESIDENT_MANAGE}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Residents"
          description="Active resident memberships in your organization."
        >
          {orgId && <LeaveRequestsPanel orgId={orgId} />}
          <ResidentTable
            residents={data}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
          />
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
