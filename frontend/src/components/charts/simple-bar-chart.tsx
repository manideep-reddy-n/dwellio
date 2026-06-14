"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  items: BarChartItem[];
  className?: string;
  maxValue?: number;
}

const defaultColors = [
  "bg-teal-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-emerald-500",
];

export function SimpleBarChart({ items, className, maxValue }: SimpleBarChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No data to chart yet.</p>;
  }

  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1);
  const active = items.find((i) => i.label === hovered);

  return (
    <div className={cn("space-y-3", className)}>
      {active && (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
          <span className="font-medium">{active.label}</span>
          <span className="text-muted-foreground"> — {active.value} complaint{active.value === 1 ? "" : "s"}</span>
        </div>
      )}
      {items.map((item, index) => {
        const width = Math.max(4, (item.value / max) * 100);
        return (
          <div
            key={item.label}
            onMouseEnter={() => setHovered(item.label)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="truncate text-muted-foreground">{item.label}</span>
              <span className="font-medium tabular-nums">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  item.color ?? defaultColors[index % defaultColors.length],
                  hovered === item.label && "opacity-100 ring-1 ring-foreground/20",
                )}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
