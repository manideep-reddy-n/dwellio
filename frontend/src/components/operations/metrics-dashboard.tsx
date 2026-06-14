"use client";

import { motion } from "framer-motion";
import {
  BedDouble,
  Star,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { formatPercent } from "@/lib/format/percent";
import type { OrganizationMetrics } from "@/types/api/dashboard";

interface MetricsDashboardProps {
  metrics: OrganizationMetrics | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  delay,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <Icon className="size-4 text-teal-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function MetricsDashboard({ metrics, isLoading, isError, onRetry }: MetricsDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={onRetry} />;

  if (!metrics) return null;

  const occupancy = formatPercent(metrics.occupancyRate);
  const rating = metrics.avgRating != null ? metrics.avgRating.toFixed(1) : "—";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Active residents"
        value={String(metrics.activeResidentCount)}
        icon={Users}
        delay={0}
      />
      <MetricCard
        label="Open complaints"
        value={String(metrics.openComplaintCount)}
        sub={
          metrics.avgFirstResponseHours != null
            ? `Avg first response ${metrics.avgFirstResponseHours.toFixed(1)}h`
            : undefined
        }
        icon={Wrench}
        delay={0.05}
      />
      <MetricCard
        label="Occupancy rate"
        value={occupancy}
        sub={
          metrics.accommodationMode === "BED_BASED"
            ? `${metrics.occupiedBeds ?? 0}/${metrics.totalBeds ?? 0} beds`
            : `${metrics.occupiedUnits ?? 0}/${metrics.totalUnits ?? 0} units`
        }
        icon={BedDouble}
        delay={0.1}
      />
      <MetricCard
        label="Avg rating"
        value={rating}
        sub={`${metrics.reviewCount} reviews`}
        icon={Star}
        delay={0.15}
      />
      {(metrics.resolutionRate != null || metrics.satisfactionScore != null) && (
        <MetricCard
          label="Resolution rate"
          value={formatPercent(metrics.resolutionRate)}
          sub={
            metrics.satisfactionScore != null
              ? `Satisfaction ${metrics.satisfactionScore.toFixed(0)}`
              : undefined
          }
          icon={TrendingUp}
          delay={0.2}
        />
      )}
    </div>
  );
}
