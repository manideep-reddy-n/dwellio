import type { OrganizationStatus } from "@/types/enums";

export interface TrustScoreInput {
  avgFirstResponseHours: number | null;
  resolutionRate: number | null;
  avgRating: number | null;
  reviewCount: number;
  /** VERIFIED orgs receive verification bonus; marketplace only shows verified profiles. */
  verificationStatus: OrganizationStatus | "VERIFIED";
}

export type TrustScoreTier = "excellent" | "good" | "fair" | "limited";

export interface TrustScoreResult {
  score: number;
  tier: TrustScoreTier;
  breakdown: {
    verification: number;
    rating: number;
    resolution: number;
    responseTime: number;
    reviewVolume: number;
  };
}

const MAX = {
  verification: 20,
  rating: 25,
  resolution: 25,
  responseTime: 20,
  reviewVolume: 10,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function tierFromScore(score: number): TrustScoreTier {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "limited";
}

/**
 * Composite trust score (0–100) derived from existing backend metrics.
 * Used on marketplace cards and public org profiles.
 */
export function computeTrustScore(input: TrustScoreInput): TrustScoreResult {
  const verification =
    input.verificationStatus === "VERIFIED" ? MAX.verification : 0;

  const rating =
    input.avgRating != null
      ? (clamp(input.avgRating, 0, 5) / 5) * MAX.rating
      : 0;

  const resolution =
    input.resolutionRate != null
      ? (clamp(input.resolutionRate, 0, 100) / 100) * MAX.resolution
      : 0;

  let responseTime = 0;
  if (input.avgFirstResponseHours != null) {
    const hours = Math.max(0, input.avgFirstResponseHours);
    const normalized = clamp(1 - hours / 48, 0, 1);
    responseTime = normalized * MAX.responseTime;
  }

  const reviewVolume =
    input.reviewCount <= 0
      ? 0
      : (Math.min(input.reviewCount, 50) / 50) * MAX.reviewVolume;

  const score = Math.round(
    verification + rating + resolution + responseTime + reviewVolume,
  );

  return {
    score: clamp(score, 0, 100),
    tier: tierFromScore(score),
    breakdown: {
      verification: Math.round(verification),
      rating: Math.round(rating),
      resolution: Math.round(resolution),
      responseTime: Math.round(responseTime),
      reviewVolume: Math.round(reviewVolume),
    },
  };
}

export const trustTierLabels: Record<TrustScoreTier, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  limited: "Limited data",
};
