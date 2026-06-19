"use client";

import Link from "next/link";
import type { AdminOrgMetricRank } from "@/lib/api/admin-platform";
import { cn } from "@/lib/utils";

interface OrgRankListProps {
  items: AdminOrgMetricRank[];
  emptyLabel?: string;
  className?: string;
}

export function OrgRankList({ items, emptyLabel = "No data yet.", className }: OrgRankListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((i) => Number(i.metricValue) || 0), 1);

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item, index) => {
        const value = Number(item.metricValue) || 0;
        const width = Math.max(6, (value / max) * 100);
        return (
          <li key={item.organizationId}>
            <Link
              href={`/admin/organizations/${item.organizationId}`}
              className="group block rounded-lg border px-3 py-2 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium group-hover:text-teal-700">
                    <span className="mr-2 text-xs text-muted-foreground">#{index + 1}</span>
                    {item.organizationName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.organizationSlug} · {item.organizationType.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">{item.metricLabel}</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-teal-500/80" style={{ width: `${width}%` }} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
