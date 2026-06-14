"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface LinePoint {
  label: string;
  value: number;
  displayValue?: string;
}

interface SimpleLineChartProps {
  points: LinePoint[];
  className?: string;
  height?: number;
}

export function SimpleLineChart({ points, className, height = 140 }: SimpleLineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">No trend data yet.</p>;
  }

  const width = 320;
  const padding = 16;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values, min + 1);
  const range = max - min;

  const coords = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y = padding + (1 - (point.value - min) / range) * (height - padding * 2);
    return { x, y, point, index };
  });

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const active = hovered != null ? coords[hovered] : null;

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 min-h-[2rem]">
        {active ? (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
            <span className="font-medium">{active.point.label}</span>
            <span className="text-muted-foreground">
              {" "}
              — {active.point.displayValue ?? active.point.value}
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Hover a point for details</p>
        )}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Trend chart">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-teal-600"
          points={polyline}
        />
        {coords.map((c) => (
          <g key={c.point.label}>
            <circle
              cx={c.x}
              cy={c.y}
              r={12}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHovered(c.index)}
              onMouseLeave={() => setHovered(null)}
            />
            <circle
              cx={c.x}
              cy={c.y}
              r={hovered === c.index ? 5 : 3}
              className={cn(
                "fill-teal-600 transition-all",
                hovered === c.index && "stroke-white stroke-[2px]",
              )}
              pointerEvents="none"
            />
          </g>
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        {points.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}
