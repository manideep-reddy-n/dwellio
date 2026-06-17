"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { OperationsAutoBack } from "@/components/shared/page-back-header";
import { PageTitle } from "@/components/shared/page-title";
import { ErrorState } from "@/components/shared/error-state";
import { VerticalTimeline } from "@/components/shared/vertical-timeline";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { Skeleton } from "@/components/ui/skeleton";
import { useTimeline } from "@/hooks/use-timeline";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function OpsTimelinePage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data = [], isLoading, isError, refetch } = useTimeline(orgId);

  return (
    <PageTransition>
      <PageTitle title="Timeline" />
      <OperationsAutoBack orgSlug={orgSlug} />
      <OpsGuard permission={PERMISSIONS.RESIDENT_MANAGE}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Resident activity timeline"
          description="Billing, accommodation, and membership events across the organization."
        >
          {isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : isLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <VerticalTimeline events={data} showResident />
          )}
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
