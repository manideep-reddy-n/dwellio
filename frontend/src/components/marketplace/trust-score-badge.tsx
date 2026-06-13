import { cn } from "@/lib/utils";
import {
  computeTrustScore,
  trustTierLabels,
  type TrustScoreInput,
  type TrustScoreTier,
} from "@/lib/marketplace/trust-score";

const tierStyles: Record<TrustScoreTier, string> = {
  excellent: "text-emerald-600 dark:text-emerald-400",
  good: "text-teal-600 dark:text-teal-400",
  fair: "text-amber-600 dark:text-amber-400",
  limited: "text-muted-foreground",
};

const tierRingStyles: Record<TrustScoreTier, string> = {
  excellent: "stroke-emerald-500",
  good: "stroke-teal-500",
  fair: "stroke-amber-500",
  limited: "stroke-muted-foreground",
};

interface TrustScoreBadgeProps {
  input: TrustScoreInput;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { dim: 40, stroke: 3, text: "text-xs" },
  md: { dim: 56, stroke: 4, text: "text-sm" },
  lg: { dim: 80, stroke: 5, text: "text-lg" },
};

export function TrustScoreBadge({
  input,
  size = "md",
  showLabel = true,
  className,
}: TrustScoreBadgeProps) {
  const result = computeTrustScore(input);
  const { dim, stroke, text } = sizeMap[size];
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (result.score / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-muted"
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={tierRingStyles[result.tier]}
          />
        </svg>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center font-semibold",
            text,
            tierStyles[result.tier],
          )}
        >
          {result.score}
        </div>
      </div>
      {showLabel && (
        <span className={cn("text-xs font-medium", tierStyles[result.tier])}>
          {trustTierLabels[result.tier]}
        </span>
      )}
    </div>
  );
}

export function TrustScoreInline({
  input,
  className,
}: {
  input: TrustScoreInput;
  className?: string;
}) {
  const result = computeTrustScore(input);
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-medium", tierStyles[result.tier], className)}>
      Trust {result.score}
      <span className="text-muted-foreground font-normal">· {trustTierLabels[result.tier]}</span>
    </span>
  );
}
