"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BadgeCheck,
  CircleDollarSign,
  Radar,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
import { SimpleLineChart } from "@/components/charts/simple-line-chart";
import { KpiCard } from "@/components/admin/mission-control/kpi-card";
import { OrgRankList } from "@/components/admin/mission-control/org-rank-list";
import { ErrorState } from "@/components/shared/error-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminPlatformApi } from "@/lib/api/admin-platform";
import { formatPercent } from "@/lib/format/percent";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatGrowth(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}% vs prior 30d`;
}

function SectionShell({
  title,
  icon: Icon,
  children,
  action,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-muted/20 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-teal-600" />
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

export function MissionControlDashboard() {
  const mission = useQuery({
    queryKey: ["admin", "mission-control"],
    queryFn: () => adminPlatformApi.missionControl(),
    refetchInterval: 30_000,
  });

  const loading = mission.isLoading;
  const data = mission.data;
  const health = data?.platformHealth;

  if (mission.isError) {
    return <ErrorState onRetry={() => void mission.refetch()} />;
  }

  const revenueTrend = (data?.revenue.revenueTrend ?? []).map((p) => ({
    label: p.month,
    value: p.collected,
    displayValue: formatCurrency(p.collected),
  }));

  const verificationTrend = (data?.verification.trends ?? []).map((p) => ({
    label: p.month,
    value: p.approved + p.rejected + p.pending,
    displayValue: `${p.approved} approved · ${p.rejected} rejected`,
  }));

  const trustDistribution = [
    { label: "Verified", value: data?.marketplace.verifiedOrganizations ?? 0, color: "bg-teal-500" },
    { label: "Unverified", value: data?.marketplace.unverifiedOrganizations ?? 0, color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="size-6 text-teal-600" />
            <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
          </div>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Platform operating system — health, revenue, verification, operations, and live activity across
            the Dwellio ecosystem.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 self-start"
          disabled={mission.isFetching}
          onClick={() => void mission.refetch()}
        >
          <RefreshCw className={cn("size-4", mission.isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Platform health
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <KpiCard label="Organizations" value={health?.totalOrganizations ?? 0} loading={loading} />
          <KpiCard
            label="Active orgs"
            value={health?.activeOrganizations ?? 0}
            hint={`${health?.suspendedOrganizations ?? 0} suspended`}
            loading={loading}
            accent="sky"
          />
          <KpiCard
            label="Verified"
            value={health?.verifiedOrganizations ?? 0}
            hint={`${health?.verificationPending ?? 0} pending`}
            loading={loading}
            accent="teal"
          />
          <KpiCard
            label="Total users"
            value={health?.totalUsers ?? 0}
            hint={`${health?.activeUsers ?? 0} active`}
            loading={loading}
          />
          <KpiCard
            label="New today"
            value={health?.newUsersToday ?? 0}
            hint={health ? formatGrowth(health.userGrowthRate30d) : undefined}
            loading={loading}
            accent="violet"
          />
          <KpiCard
            label="Total revenue"
            value={health ? formatCurrency(health.totalRevenue) : "—"}
            loading={loading}
            accent="teal"
          />
          <KpiCard
            label="Monthly revenue"
            value={health ? formatCurrency(health.monthlyRevenue) : "—"}
            hint={health ? formatGrowth(health.revenueGrowthRate30d) : undefined}
            loading={loading}
            accent="sky"
          />
          <KpiCard
            label="Complaints"
            value={health?.totalComplaints ?? 0}
            hint={`${health?.openComplaints ?? 0} open`}
            loading={loading}
            accent="amber"
          />
          <KpiCard
            label="SLA violations"
            value={health?.slaViolations ?? 0}
            loading={loading}
            accent="rose"
          />
          <KpiCard
            label="Occupancy"
            value={health ? formatPercent(health.platformOccupancyRate) : "—"}
            loading={loading}
            accent="violet"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionShell title="Live activity" icon={Activity} className="xl:col-span-1">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
              {(data?.liveActivity ?? []).map((item) => (
                <li key={item.id} className="rounded-lg border px-3 py-2.5 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{item.title}</p>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {item.kind.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  {item.subtitle && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {item.organizationName ? `${item.organizationName} · ` : ""}
                    {new Date(item.occurredAt).toLocaleString()}
                  </p>
                </li>
              ))}
              {(data?.liveActivity.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">No recent platform activity.</p>
              )}
            </ul>
          )}
        </SectionShell>

        <div className="space-y-6 xl:col-span-2">
          <SectionShell
            title="Verification command center"
            icon={BadgeCheck}
            action={
              <Link
                href="/admin/verification-requests"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Open queue ({data?.verification.pendingCount ?? "…"})
              </Link>
            }
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-3 flex gap-4 text-sm">
                  <span>
                    <span className="font-semibold">{data?.verification.pendingCount ?? 0}</span> pending
                  </span>
                  <span className="text-muted-foreground">
                    {data?.verification.recentlyRejected ?? 0} rejected (30d)
                  </span>
                </div>
                <ul className="space-y-2">
                  {(data?.verification.pendingQueue ?? []).slice(0, 5).map((item) => (
                    <li key={item.requestId}>
                      <Link
                        href={`/admin/verification-requests/${item.requestId}`}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.organizationName}</p>
                          <p className="text-xs text-muted-foreground">{item.organizationSlug}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(item.submittedAt).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {(data?.verification.pendingQueue.length ?? 0) === 0 && !loading && (
                    <p className="text-sm text-muted-foreground">Verification queue is clear.</p>
                  )}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Verification trends
                </p>
                {loading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <SimpleLineChart points={verificationTrend} />
                )}
              </div>
            </div>
          </SectionShell>

          <SectionShell title="Revenue command center" icon={CircleDollarSign}>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">Outstanding dues</p>
                <p className="text-xl font-bold tabular-nums">
                  {data ? formatCurrency(data.revenue.outstandingDues) : "—"}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">Forecast next month</p>
                <p className="text-xl font-bold tabular-nums">
                  {data ? formatCurrency(data.revenue.forecastNextMonth) : "—"}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">Revenue growth</p>
                <p className="text-xl font-bold tabular-nums">
                  {health ? formatGrowth(health.revenueGrowthRate30d) : "—"}
                </p>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Revenue trend</p>
                {loading ? <Skeleton className="h-40 w-full" /> : <SimpleLineChart points={revenueTrend} />}
              </div>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Top revenue</p>
                  <OrgRankList items={data?.revenue.topRevenueOrganizations ?? []} />
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Lowest collection rate
                </p>
                <OrgRankList items={data?.revenue.lowestCollectionRate ?? []} />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Highest defaulters
                </p>
                <OrgRankList items={data?.revenue.highestDefaulters ?? []} />
              </div>
            </div>
          </SectionShell>
        </div>
      </div>

      <SectionShell title="Operations command center" icon={ShieldAlert}>
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Highest complaint volume
            </p>
            <OrgRankList items={data?.operations.highestComplaintVolume ?? []} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Poorest ratings</p>
            <OrgRankList items={data?.operations.poorestRatings ?? []} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">SLA violations</p>
            <OrgRankList items={data?.operations.slaViolationLeaders ?? []} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Occupancy problems</p>
            <OrgRankList items={data?.operations.occupancyProblems ?? []} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Declining satisfaction
            </p>
            <OrgRankList items={data?.operations.decliningSatisfaction ?? []} />
          </div>
        </div>
      </SectionShell>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionShell title="Resident intelligence" icon={Users}>
          <div className="grid gap-6 sm:grid-cols-3">
            <ResidentInsightColumn
              title="Recently joined"
              items={data?.residents.recentlyJoined ?? []}
              loading={loading}
            />
            <ResidentInsightColumn
              title="Frequent complaints"
              items={data?.residents.frequentComplaints ?? []}
              loading={loading}
            />
            <ResidentInsightColumn
              title="Outstanding dues"
              items={data?.residents.outstandingDues ?? []}
              loading={loading}
            />
          </div>
        </SectionShell>

        <SectionShell title="Marketplace intelligence" icon={TrendingUp}>
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <span>
              Avg trust score{" "}
              <strong className="tabular-nums">
                {(data?.marketplace.averageTrustScore ?? 0).toFixed(1)}
              </strong>
            </span>
            <span className="text-muted-foreground">
              {data?.marketplace.verifiedOrganizations ?? 0} verified ·{" "}
              {data?.marketplace.unverifiedOrganizations ?? 0} unverified
            </span>
          </div>
          <div className="mb-6 max-w-xs">
            <SimpleBarChart
              items={trustDistribution}
              maxValue={Math.max(...trustDistribution.map((s) => s.value), 1)}
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Highest rated</p>
              <OrgRankList items={data?.marketplace.highestRated ?? []} />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Lowest rated</p>
              <OrgRankList items={data?.marketplace.lowestRated ?? []} />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Trust score leaders</p>
              <OrgRankList items={data?.marketplace.highestTrustScore ?? []} />
            </div>
          </div>
        </SectionShell>
      </div>
    </div>
  );
}

function ResidentInsightColumn({
  title,
  items,
  loading,
}: {
  title: string;
  items: { membershipId: string; userId: string; fullName: string; organizationName: string; detail: string; occurredAt: string }[];
  loading: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">{title}</p>
      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((item) => (
            <li key={item.membershipId}>
              <Link
                href={`/admin/users/${item.userId}`}
                className="block rounded-lg border px-3 py-2 text-sm hover:bg-muted/50"
              >
                <p className="font-medium">{item.fullName}</p>
                <p className="text-xs text-muted-foreground">{item.organizationName}</p>
                <p className="mt-0.5 text-xs">{item.detail}</p>
              </Link>
            </li>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">None flagged.</p>}
        </ul>
      )}
    </div>
  );
}
