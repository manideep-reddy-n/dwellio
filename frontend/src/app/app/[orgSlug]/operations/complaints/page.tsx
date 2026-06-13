"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { ComplaintKanban } from "@/components/operations/complaint-kanban";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { useOrgComplaints } from "@/hooks/use-org-complaints";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function ComplaintsPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data, isLoading, isError, refetch } = useOrgComplaints(orgId);

  return (
    <PageTransition>
      <OpsGuard permission={PERMISSIONS.COMPLAINT_READ}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Complaints"
          description="Kanban workflow — assign, progress, resolve, and close in real time."
        >
          {orgId && (
            <ComplaintKanban
              orgId={orgId}
              complaints={data}
              isLoading={isLoading}
              isError={isError}
              onRetry={() => void refetch()}
            />
          )}
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
