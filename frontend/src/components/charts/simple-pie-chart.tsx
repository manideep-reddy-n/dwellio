"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface SimplePieChartProps {
  slices: PieSlice[];
  size?: number;
  className?: string;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function SimplePieChart({ slices, size = 140, className }: SimplePieChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No data to chart yet.</p>;
  }

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 4;

  let angle = 0;
  const segments = slices.map((slice) => {
    const sweep = (slice.value / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return { ...slice, start, end, path: describeArc(cx, cy, radius, start, end) };
  });

  const active = segments.find((s) => s.label === hovered);

  return (
    <div className={cn("flex items-start gap-4", className)}>
      <div className="relative shrink-0">
        <svg width={size} height={size} role="img" aria-label="Pie chart">
          {segments.map((segment) => (
            <path
              key={segment.label}
              d={segment.path}
              fill={segment.color}
              stroke="white"
              strokeWidth={hovered === segment.label ? 2 : 1}
              opacity={hovered && hovered !== segment.label ? 0.45 : 1}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setHovered(segment.label)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        {active && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-1">
            <div className="rounded-md border bg-background/95 px-2 py-1 text-center text-[10px] font-medium shadow-sm">
              {active.value} ({Math.round((active.value / total) * 100)}%)
            </div>
          </div>
        )}
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
        {segments.map((slice) => (
          <li
            key={slice.label}
            className={cn(
              "flex cursor-default items-center gap-2 rounded px-1 py-0.5",
              hovered === slice.label && "bg-muted",
            )}
            onMouseEnter={() => setHovered(slice.label)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: slice.color }} />
            <span className="truncate text-muted-foreground">{slice.label}</span>
            <span className="ml-auto font-medium tabular-nums">
              {slice.value} ({Math.round((slice.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
