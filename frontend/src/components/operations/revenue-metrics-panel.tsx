"use client";

import Link from "next/link";
import { AlertTriangle, IndianRupee, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SimpleLineChart } from "@/components/charts/simple-line-chart";
import { formatPercent } from "@/lib/format/percent";
import { formatInr } from "@/lib/format/currency";
import type { OrganizationMetrics } from "@/types/api/dashboard";

interface RevenueMetricsPanelProps {
  metrics: OrganizationMetrics | undefined;
  orgSlug: string;
  isLoading?: boolean;
}

export function RevenueMetricsPanel({ metrics, orgSlug, isLoading }: RevenueMetricsPanelProps) {
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

  const hasRevenue =
    metrics.expectedRevenueMonth != null ||
    metrics.collectedRevenueMonth != null ||
    metrics.forecastRevenueNextMonth != null;

  if (!hasRevenue) return null;

  const trendPoints = (metrics.revenueTrend ?? []).map((point) => ({
    label: point.month.slice(0, 7),
    value: point.collected,
    displayValue: formatInr(point.collected),
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expected (month)</CardTitle>
            <IndianRupee className="size-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatInr(metrics.expectedRevenueMonth)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Collected (month)</CardTitle>
            <Wallet className="size-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatInr(metrics.collectedRevenueMonth)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatPercent(metrics.collectionRate)} collection rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
            <AlertTriangle className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatInr(metrics.outstandingRevenueMonth)}</div>
            <Link
              href={`/app/${orgSlug}/operations/defaulters`}
              className="mt-1 text-xs font-medium text-primary hover:underline"
            >
              {metrics.defaultersCount} defaulter{metrics.defaultersCount === 1 ? "" : "s"}
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Forecast (next month)</CardTitle>
            <TrendingUp className="size-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatInr(metrics.forecastRevenueNextMonth)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Based on active occupancies</p>
          </CardContent>
        </Card>
      </div>

      {trendPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue trend (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart points={trendPoints} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
