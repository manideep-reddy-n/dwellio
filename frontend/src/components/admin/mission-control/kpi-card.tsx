"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  loading?: boolean;
  accent?: "teal" | "amber" | "rose" | "sky" | "violet";
  className?: string;
}

const accentBorder: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  teal: "border-l-teal-500",
  amber: "border-l-amber-500",
  rose: "border-l-rose-500",
  sky: "border-l-sky-500",
  violet: "border-l-violet-500",
};

export function KpiCard({ label, value, hint, loading, accent = "teal", className }: KpiCardProps) {
  return (
    <Card className={cn("border-l-4", accentBorder[accent], className)}>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-9 w-24" />
        ) : (
          <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">{value}</p>
        )}
        {hint && !loading && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
