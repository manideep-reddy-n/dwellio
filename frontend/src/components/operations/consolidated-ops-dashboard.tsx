"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BedDouble,
  CalendarClock,
  Clock,
  CreditCard,
  IndianRupee,
  ShieldAlert,
  Star,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
import { SimpleLineChart } from "@/components/charts/simple-line-chart";
import { SimplePieChart } from "@/components/charts/simple-pie-chart";
import { TrustScoreBadge } from "@/components/marketplace/trust-score-badge";
import { TrustScoreBreakdown } from "@/components/marketplace/trust-score-breakdown";
import { DashboardMetricCard } from "@/components/operations/dashboard-metric-card";
import { DashboardSection } from "@/components/operations/dashboard-section";
import { formatInr } from "@/lib/format/currency";
import { formatPercent } from "@/lib/format/percent";
import { trustInputFromDashboardMetrics } from "@/lib/dashboard/trust-from-metrics";
import type { OrganizationMetrics } from "@/types/api/dashboard";
import type { OrganizationType } from "@/types/enums";

const complaintCategoryLabels: Record<string, string> = {
  WIFI: "Wi-Fi",
  FOOD: "Food",
  HOUSEKEEPING: "Housekeeping",
  MAINTENANCE: "Maintenance",
  ELECTRICITY: "Electricity",
  PLUMBING: "Plumbing",
  SECURITY: "Security",
  NOISE: "Noise",
  PAYMENT: "Payment",
  OTHER: "Other",
};

interface ConsolidatedOpsDashboardProps {
  metrics: OrganizationMetrics | undefined;
  orgSlug: string;
  orgType?: OrganizationType;
  orgVerified?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

function formatDays(value: number | null | undefined) {
  if (value == null) return "—";
  return `${value.toFixed(0)} days`;
}

function MetricGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

function LoadingSections() {
  return (
    <div className="space-y-10">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConsolidatedOpsDashboard({
  metrics,
  orgSlug,
  orgType,
  orgVerified = false,
  isLoading,
  isError,
  onRetry,
}: ConsolidatedOpsDashboardProps) {
  if (isLoading) return <LoadingSections />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (!metrics) return null;

  const base = `/app/${orgSlug}/operations`;
  const isBedBased = metrics.accommodationMode === "BED_BASED";
  const showMeals =
    orgType === "HOSTEL" || orgType === "PG" || orgType === "CO_LIVING";

  const hasRevenue =
    metrics.expectedRevenueMonth != null ||
    metrics.collectedRevenueMonth != null ||
    metrics.forecastRevenueNextMonth != null;

  const revenueTrend = (metrics.revenueTrend ?? []).map((point) => ({
    label: point.month.slice(0, 7),
    value: point.collected,
    displayValue: formatInr(point.collected),
  }));

  const complaintItems = (metrics.complaintCategoryDistribution ?? [])
    .filter((c) => c.count > 0)
    .slice(0, 6)
    .map((c) => ({
      label: complaintCategoryLabels[c.category] ?? c.category,
      value: c.count,
    }));

  const occupancySlices = [
    {
      label: isBedBased ? "Occupied beds" : "Occupied units",
      value: isBedBased ? (metrics.occupiedBeds ?? 0) : (metrics.occupiedUnits ?? 0),
      color: "#0d9488",
    },
    {
      label: isBedBased ? "Available beds" : "Available units",
      value: isBedBased ? (metrics.availableBeds ?? 0) : (metrics.availableUnits ?? 0),
      color: "#38bdf8",
    },
    {
      label: "Blocked",
      value: isBedBased ? (metrics.blockedBeds ?? 0) : (metrics.blockedUnits ?? 0),
      color: "#f59e0b",
    },
  ].filter((s) => s.value > 0);

  const totalCapacity = isBedBased ? (metrics.totalBeds ?? 0) : (metrics.totalUnits ?? 0);
  const vacantRooms = metrics.vacantRooms ?? 0;
  const trustInput = trustInputFromDashboardMetrics(metrics, orgVerified);

  const hasMealRatings =
    metrics.avgBreakfastRating != null ||
    metrics.avgLunchRating != null ||
    metrics.avgDinnerRating != null;

  return (
    <div className="space-y-10">
      {hasRevenue && (
        <DashboardSection
          title="Financial operations"
          description="Monthly billing, collections, and outstanding dues."
          href={`${base}/payments`}
        >
          <MetricGrid>
            <DashboardMetricCard
              label="Expected (month)"
              value={formatInr(metrics.expectedRevenueMonth)}
              icon={IndianRupee}
            />
            <DashboardMetricCard
              label="Collected (month)"
              value={formatInr(metrics.collectedRevenueMonth)}
              sub={`${formatPercent(metrics.collectionRate)} collection rate`}
              icon={Wallet}
            />
            <DashboardMetricCard
              label="Outstanding"
              value={formatInr(metrics.outstandingRevenueMonth)}
              icon={AlertTriangle}
              footer={
                <Link
                  href={`${base}/defaulters`}
                  className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                >
                  {metrics.defaultersCount} defaulter{metrics.defaultersCount === 1 ? "" : "s"}
                </Link>
              }
            />
            <DashboardMetricCard
              label="Pending payments"
              value={String(metrics.pendingPaymentsCount)}
              sub="Open charges awaiting collection"
              icon={CreditCard}
            />
          </MetricGrid>
          <div className="grid gap-4 lg:grid-cols-2">
            <DashboardMetricCard
              label="Forecast (next month)"
              value={formatInr(metrics.forecastRevenueNextMonth)}
              sub="Based on active occupancies"
              icon={TrendingUp}
            />
            {revenueTrend.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Revenue trend (6 months)</CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleLineChart points={revenueTrend} />
                </CardContent>
              </Card>
            )}
          </div>
        </DashboardSection>
      )}

      <DashboardSection
        title="Accommodation operations"
        description="Occupancy, availability, and move activity this month."
        href={`${base}/accommodation`}
      >
        <MetricGrid>
          <DashboardMetricCard
            label="Occupancy rate"
            value={formatPercent(metrics.occupancyRate)}
            sub={
              isBedBased
                ? `${metrics.occupiedBeds ?? 0}/${metrics.totalBeds ?? 0} beds occupied`
                : `${metrics.occupiedUnits ?? 0}/${metrics.totalUnits ?? 0} units occupied`
            }
            icon={BedDouble}
          />
          <DashboardMetricCard
            label={isBedBased ? "Available beds" : "Available units"}
            value={String(isBedBased ? (metrics.availableBeds ?? 0) : (metrics.availableUnits ?? 0))}
            sub={isBedBased && metrics.totalRooms != null ? `${vacantRooms} vacant rooms` : undefined}
            icon={BedDouble}
          />
          <DashboardMetricCard
            label="Move-ins (month)"
            value={String(metrics.moveInsMonth)}
            sub={`${metrics.moveOutsMonth} move-out${metrics.moveOutsMonth === 1 ? "" : "s"} this month`}
            icon={CalendarClock}
          />
          <DashboardMetricCard
            label="Blocked inventory"
            value={String(isBedBased ? (metrics.blockedBeds ?? 0) : (metrics.blockedUnits ?? 0))}
            sub={totalCapacity > 0 ? `${totalCapacity} total capacity` : undefined}
            icon={BedDouble}
          />
        </MetricGrid>
        {occupancySlices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Occupancy split</CardTitle>
            </CardHeader>
            <CardContent className="max-w-md">
              <SimplePieChart slices={occupancySlices} />
            </CardContent>
          </Card>
        )}
      </DashboardSection>

      <DashboardSection
        title="Resident operations"
        description="Headcount and stay patterns across active residents."
        href={`${base}/residents`}
      >
        <MetricGrid>
          <DashboardMetricCard
            label="Active residents"
            value={String(metrics.activeResidentCount)}
            icon={Users}
          />
          <DashboardMetricCard
            label="Avg stay duration"
            value={formatDays(metrics.avgStayDays)}
            icon={Clock}
          />
          <DashboardMetricCard
            label="Turnover rate"
            value={formatPercent(metrics.turnoverRate)}
            sub="Move-outs vs active residents this month"
            icon={TrendingUp}
          />
        </MetricGrid>
      </DashboardSection>

      <DashboardSection
        title="Complaint operations"
        description="Issue volume, response times, and SLA compliance."
        href={`${base}/complaints`}
      >
        <MetricGrid>
          <DashboardMetricCard
            label="Open complaints"
            value={String(metrics.openComplaintCount)}
            sub={
              metrics.avgFirstResponseHours != null
                ? `Avg first response ${metrics.avgFirstResponseHours.toFixed(1)}h`
                : undefined
            }
            icon={Wrench}
          />
          <DashboardMetricCard
            label="SLA compliance"
            value={formatPercent(metrics.slaComplianceRate)}
            sub={`Target ${metrics.slaFirstResponseHours}h response · ${metrics.slaResolutionHours}h resolution`}
            icon={ShieldAlert}
          />
          <DashboardMetricCard
            label="SLA violations"
            value={String(metrics.slaViolationsCount)}
            sub={`${metrics.reopenedComplaintsCount} reopened complaint${metrics.reopenedComplaintsCount === 1 ? "" : "s"}`}
            icon={AlertTriangle}
            href={metrics.slaViolationsCount > 0 ? `${base}/complaints?slaBreach=true` : undefined}
          />
          <DashboardMetricCard
            label="Resolution rate"
            value={formatPercent(metrics.resolutionRate)}
            sub={
              metrics.avgResolutionDays != null
                ? `Avg resolution ${metrics.avgResolutionDays.toFixed(1)} days`
                : undefined
            }
            icon={TrendingUp}
          />
        </MetricGrid>
        {complaintItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Complaints by category</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart items={complaintItems} />
            </CardContent>
          </Card>
        )}
      </DashboardSection>

      <DashboardSection
        title="Review operations"
        description="Resident satisfaction and marketplace trust signals."
        href={`${base}/reviews`}
      >
        <MetricGrid>
          <DashboardMetricCard
            label="Average rating"
            value={metrics.avgRating != null ? metrics.avgRating.toFixed(1) : "—"}
            sub={`${metrics.reviewCount} review${metrics.reviewCount === 1 ? "" : "s"}`}
            icon={Star}
          />
          <DashboardMetricCard
            label="Satisfaction score"
            value={metrics.satisfactionScore != null ? metrics.satisfactionScore.toFixed(0) : "—"}
            sub={
              metrics.searchRankScore != null
                ? `Marketplace rank ${metrics.searchRankScore.toFixed(1)}`
                : "Composite service quality score"
            }
            icon={Star}
          />
        </MetricGrid>
        <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
          <div className="flex justify-center lg:justify-start">
            <TrustScoreBadge input={trustInput} size="lg" />
          </div>
          <TrustScoreBreakdown input={trustInput} />
        </div>
      </DashboardSection>

      {showMeals && (
        <DashboardSection
          title="Meal operations"
          description="Resident meal feedback and daily menu quality."
          href={`${base}/food-menu`}
        >
          {hasMealRatings ? (
            <>
              <MetricGrid>
                <DashboardMetricCard
                  label="Breakfast"
                  value={metrics.avgBreakfastRating?.toFixed(1) ?? "—"}
                  icon={UtensilsCrossed}
                />
                <DashboardMetricCard
                  label="Lunch"
                  value={metrics.avgLunchRating?.toFixed(1) ?? "—"}
                  icon={UtensilsCrossed}
                />
                <DashboardMetricCard
                  label="Dinner"
                  value={metrics.avgDinnerRating?.toFixed(1) ?? "—"}
                  icon={UtensilsCrossed}
                />
              </MetricGrid>
              {(metrics.mealRatingsTrend ?? []).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Meal ratings trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SimpleLineChart
                      points={metrics.mealRatingsTrend.map((point) => ({
                        label: point.date.slice(5),
                        value: point.avgRating ?? 0,
                        displayValue:
                          point.avgRating != null ? `${point.avgRating.toFixed(1)} ★` : "No ratings",
                      }))}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Meal ratings will appear here once residents submit feedback. Menu management is available
              under Food menu.
            </p>
          )}
        </DashboardSection>
      )}

      <p className="text-xs text-muted-foreground">
        Metrics refreshed {new Date(metrics.refreshedAt).toLocaleString()}
      </p>
    </div>
  );
}
