"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { PageTransition } from "@/components/shared/page-transition";
import { ComplaintKanban } from "@/components/operations/complaint-kanban";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { useOrgComplaints } from "@/hooks/use-org-complaints";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function ComplaintsPage() {
  const searchParams = useSearchParams();
  const slaBreachOnly = searchParams.get("slaBreach") === "true";
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data, isLoading, isError, refetch } = useOrgComplaints(
    orgId,
    slaBreachOnly ? { slaBreach: true } : undefined,
  );

  return (
    <PageTransition>
      <OpsGuard permission={PERMISSIONS.COMPLAINT_READ}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Complaints"
          description="Kanban workflow — assign, progress, resolve, and close in real time."
        >
          {slaBreachOnly && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>Showing complaints that have breached SLA targets.</span>
              </div>
              <Link
                href={`/app/${orgSlug}/operations/complaints`}
                className="inline-flex h-8 shrink-0 items-center rounded-md px-3 text-sm font-medium hover:bg-muted"
              >
                <X className="mr-1 size-3.5" />
                Clear filter
              </Link>
            </div>
          )}
          {orgId && (
            <ComplaintKanban
              orgId={orgId}
              complaints={data}
              isLoading={isLoading}
              isError={isError}
              onRetry={() => void refetch()}
              highlightSlaBreach
            />
          )}
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
