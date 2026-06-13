import { BedDouble, Building2, Clock, ShieldCheck, Star, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatAvailability,
  formatRating,
  formatResponseTime,
  orgTypeLabels,
} from "@/lib/marketplace/format";
import type { PublicOrganizationMetrics } from "@/types/api/marketplace";

interface MetricsStripProps {
  type: keyof typeof orgTypeLabels;
  metrics: PublicOrganizationMetrics;
}

export function MetricsStrip({ type, metrics }: MetricsStripProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <MetricItem
        icon={Star}
        label="Rating"
        value={formatRating(metrics.avgRating, metrics.reviewCount)}
      />
      <MetricItem
        icon={BedDouble}
        label="Availability"
        value={formatAvailability(metrics)}
      />
      <MetricItem
        icon={Clock}
        label="Response"
        value={formatResponseTime(metrics.avgFirstResponseHours)}
      />
      <MetricItem
        icon={Wrench}
        label="Resolution"
        value={
          metrics.resolutionRate != null
            ? `${Math.round(metrics.resolutionRate)}% resolved`
            : "—"
        }
      />
      <MetricItem
        icon={Building2}
        label="Type"
        value={orgTypeLabels[type]}
      />
      <MetricItem
        icon={ShieldCheck}
        label="Status"
        value={<Badge variant="secondary">Verified</Badge>}
      />
    </div>
  );
}

function MetricItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
