"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { JoinRequestPanel } from "@/components/operations/join-request-panel";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { useJoinRequests } from "@/hooks/use-join-requests";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function JoinRequestsPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data, isLoading, isError, refetch } = useJoinRequests(orgId);

  return (
    <PageTransition>
      <OpsGuard permission={PERMISSIONS.RESIDENT_APPROVE}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Join requests"
          description="Review and approve new resident applications."
        >
          {orgId && (
            <JoinRequestPanel
              orgId={orgId}
              requests={data}
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
