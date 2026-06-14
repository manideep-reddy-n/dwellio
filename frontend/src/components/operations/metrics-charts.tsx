"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
import { SimpleLineChart } from "@/components/charts/simple-line-chart";
import { SimplePieChart } from "@/components/charts/simple-pie-chart";
import { formatPercent, percentForChart } from "@/lib/format/percent";
import type { OrganizationMetrics } from "@/types/api/dashboard";

const categoryLabels: Record<string, string> = {
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

interface MetricsChartsProps {
  metrics: OrganizationMetrics;
}

export function MetricsCharts({ metrics }: MetricsChartsProps) {
  const complaintItems = (metrics.complaintCategoryDistribution ?? [])
    .filter((c) => c.count > 0)
    .slice(0, 6)
    .map((c) => ({
      label: categoryLabels[c.category] ?? c.category,
      value: c.count,
    }));

  const occupancySlices = [
    {
      label: metrics.accommodationMode === "BED_BASED" ? "Occupied beds" : "Occupied units",
      value:
        metrics.accommodationMode === "BED_BASED"
          ? (metrics.occupiedBeds ?? 0)
          : (metrics.occupiedUnits ?? 0),
      color: "#0d9488",
    },
    {
      label: metrics.accommodationMode === "BED_BASED" ? "Available beds" : "Available units",
      value:
        metrics.accommodationMode === "BED_BASED"
          ? (metrics.availableBeds ?? 0)
          : (metrics.availableUnits ?? 0),
      color: "#38bdf8",
    },
    {
      label: "Blocked",
      value:
        metrics.accommodationMode === "BED_BASED"
          ? (metrics.blockedBeds ?? 0)
          : (metrics.blockedUnits ?? 0),
      color: "#f59e0b",
    },
  ].filter((s) => s.value > 0);

  const totalCapacity =
    metrics.accommodationMode === "BED_BASED"
      ? (metrics.totalBeds ?? 0)
      : (metrics.totalUnits ?? 0);

  const operationsPoints = [
    {
      label: "Residents",
      value: metrics.activeResidentCount,
      displayValue: `${metrics.activeResidentCount} active`,
    },
    {
      label: "Open issues",
      value: metrics.openComplaintCount,
      displayValue: `${metrics.openComplaintCount} open complaints`,
    },
    {
      label: "Rating",
      value: metrics.avgRating != null ? metrics.avgRating : 0,
      displayValue: metrics.avgRating != null ? `${metrics.avgRating.toFixed(1)} / 5` : "No ratings yet",
    },
    {
      label: "Resolution",
      value: percentForChart(metrics.resolutionRate),
      displayValue: formatPercent(metrics.resolutionRate) + " resolved",
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Complaints by category</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleBarChart items={complaintItems} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Occupancy split</CardTitle>
          {totalCapacity > 0 && (
            <p className="text-xs text-muted-foreground">
              {totalCapacity} total {metrics.accommodationMode === "BED_BASED" ? "beds" : "units"}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <SimplePieChart slices={occupancySlices} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operations snapshot</CardTitle>
          <p className="text-xs text-muted-foreground">Hover points for labeled values</p>
        </CardHeader>
        <CardContent>
          <SimpleLineChart points={operationsPoints} />
        </CardContent>
      </Card>
    </div>
  );
}
