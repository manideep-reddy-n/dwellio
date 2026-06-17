"use client";

import { ArrowDownUp, CalendarClock, Clock, CreditCard, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent } from "@/lib/format/percent";
import type { OrganizationMetrics } from "@/types/api/dashboard";

interface OperationsKpiPanelProps {
  metrics: OrganizationMetrics | undefined;
  isLoading?: boolean;
}

function formatDays(value: number | null | undefined) {
  if (value == null) return "—";
  return `${value.toFixed(0)} days`;
}

export function OperationsKpiPanel({ metrics, isLoading }: OperationsKpiPanelProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Move-ins (month)</CardTitle>
          <CalendarClock className="size-4 text-teal-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.moveInsMonth}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {metrics.moveOutsMonth} move-out{metrics.moveOutsMonth === 1 ? "" : "s"} this month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Avg stay</CardTitle>
          <Clock className="size-4 text-teal-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatDays(metrics.avgStayDays)}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Turnover {formatPercent(metrics.turnoverRate)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">SLA compliance</CardTitle>
          <ShieldAlert className="size-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercent(metrics.slaComplianceRate)}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {metrics.slaViolationsCount} violation{metrics.slaViolationsCount === 1 ? "" : "s"} ·{" "}
            {metrics.reopenedComplaintsCount} reopened
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pending payments</CardTitle>
          <CreditCard className="size-4 text-teal-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.pendingPaymentsCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Trust score {metrics.satisfactionScore != null ? metrics.satisfactionScore.toFixed(0) : "—"}
            {metrics.searchRankScore != null ? ` · rank ${metrics.searchRankScore.toFixed(1)}` : ""}
          </p>
        </CardContent>
      </Card>
      {(metrics.avgBreakfastRating != null ||
        metrics.avgLunchRating != null ||
        metrics.avgDinnerRating != null) && (
        <Card className="sm:col-span-2 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meal ratings</CardTitle>
            <ArrowDownUp className="size-4 text-teal-600" />
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6 text-sm">
            <span>Breakfast {metrics.avgBreakfastRating?.toFixed(1) ?? "—"}</span>
            <span>Lunch {metrics.avgLunchRating?.toFixed(1) ?? "—"}</span>
            <span>Dinner {metrics.avgDinnerRating?.toFixed(1) ?? "—"}</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
