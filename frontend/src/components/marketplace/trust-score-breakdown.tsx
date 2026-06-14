"use client";

import {
  computeTrustScore,
  trustTierLabels,
  type TrustScoreInput,
} from "@/lib/marketplace/trust-score";
import { cn } from "@/lib/utils";

interface TrustScoreBreakdownProps {
  input: TrustScoreInput;
  className?: string;
}

const breakdownLabels: Record<keyof ReturnType<typeof computeTrustScore>["breakdown"], string> = {
  verification: "Verified profile",
  rating: "Resident ratings",
  resolution: "Complaint resolution rate",
  responseTime: "Response speed",
  reviewVolume: "Review volume",
};

const breakdownMax = {
  verification: 20,
  rating: 25,
  resolution: 25,
  responseTime: 20,
  reviewVolume: 10,
} as const;

export function TrustScoreBreakdown({ input, className }: TrustScoreBreakdownProps) {
  const result = computeTrustScore(input);

  return (
    <section className={cn("rounded-xl border bg-muted/20 p-5", className)}>
      <h2 className="text-lg font-semibold">How trust score is calculated</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Score {result.score}/100 · {trustTierLabels[result.tier]}. Derived from verified status and live
        service metrics — not paid placement.
      </p>
      <ul className="mt-4 space-y-3">
        {(Object.keys(result.breakdown) as Array<keyof typeof result.breakdown>).map((key) => {
          const points = result.breakdown[key];
          const max = breakdownMax[key];
          const pct = max > 0 ? Math.round((points / max) * 100) : 0;

          return (
            <li key={key}>
              <div className="flex items-center justify-between text-sm">
                <span>{breakdownLabels[key]}</span>
                <span className="tabular-nums text-muted-foreground">
                  {points}/{max}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-teal-600 dark:bg-teal-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
