"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { MetricsCharts } from "@/components/operations/metrics-charts";
import { PageTitle } from "@/components/shared/page-title";
import { MetricsDashboard } from "@/components/operations/metrics-dashboard";
import { OrgTrustPanel } from "@/components/operations/org-trust-panel";
import { OwnerHomeHero } from "@/components/operations/owner-home-hero";
import { SuspensionAlert } from "@/components/operations/suspension-alert";
import { TodayMenuCard } from "@/components/food-menu/today-menu-card";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { Button } from "@/components/ui/button";
import { useDashboard, useRebuildMetrics } from "@/hooks/use-dashboard";
import { useJoinRequests } from "@/hooks/use-join-requests";
import { useOrganization } from "@/hooks/use-organization";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";
import { ownerHomeQuotes } from "@/lib/copy/home-messaging";
import { toast } from "sonner";

export default function OperationsDashboardPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data: org } = useOrganization(orgId);
  const { data, isLoading, isError, refetch } = useDashboard(orgId);
  const { data: joinRequests = [] } = useJoinRequests(orgId);
  const rebuild = useRebuildMetrics(orgId);

  const pendingJoins = joinRequests.filter((j) => j.status === "PENDING").length;
  const openComplaints = data?.openComplaintCount ?? 0;

  return (
    <PageTransition>
      <PageTitle title="Dashboard" />
      <OpsGuard permission={PERMISSIONS.DASHBOARD_VIEW}>
        <div className="space-y-6">
          <OwnerHomeHero
            orgName={activeOrg?.name ?? "Your organization"}
            orgSlug={orgSlug}
            pendingJoins={pendingJoins}
            openComplaints={openComplaints}
          />

          <SuspensionAlert orgId={orgId!} status={org?.status} />

          {(org?.type === "HOSTEL" || org?.type === "PG") && (
            <TodayMenuCard orgId={orgId} title="Today's menu (resident view)" />
          )}

          <OperationsShell
            orgSlug={orgSlug}
            title="Analytics dashboard"
            description={ownerHomeQuotes.description}
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
            {data && <MetricsCharts metrics={data} />}
          </OperationsShell>

          <OperationsShell
            orgSlug={orgSlug}
            title="Trust score"
            description="How residents and the marketplace see your property's service quality."
          >
            <OrgTrustPanel orgSlug={orgSlug} />
          </OperationsShell>
        </div>
      </OpsGuard>
    </PageTransition>
  );
}
