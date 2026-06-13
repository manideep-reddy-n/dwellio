"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { MetricsDashboard } from "@/components/operations/metrics-dashboard";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { Button } from "@/components/ui/button";
import { useDashboard, useRebuildMetrics } from "@/hooks/use-dashboard";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";
import { toast } from "sonner";

export default function OperationsDashboardPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data, isLoading, isError, refetch } = useDashboard(orgId);
  const rebuild = useRebuildMetrics(orgId);

  return (
    <PageTransition>
      <OpsGuard permission={PERMISSIONS.DASHBOARD_VIEW}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Operations dashboard"
          description="Organization metrics and performance at a glance."
          actions={
            <Button
              variant="outline"
              size="sm"
              disabled={rebuild.isPending}
              onClick={() =>
                rebuild.mutate(undefined, {
                  onSuccess: () => toast.success("Metrics refreshed"),
                  onError: () => toast.error("Could not rebuild metrics"),
                })
              }
            >
              Refresh metrics
            </Button>
          }
        >
          <MetricsDashboard
            metrics={data}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
          />
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
