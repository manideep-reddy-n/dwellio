import type { TrustScoreInput } from "@/lib/marketplace/trust-score";
import type { OrganizationMetrics } from "@/types/api/dashboard";

export function trustInputFromDashboardMetrics(
  metrics: OrganizationMetrics,
  verified: boolean,
): TrustScoreInput {
  return {
    avgFirstResponseHours: metrics.avgFirstResponseHours,
    resolutionRate: metrics.resolutionRate,
    avgRating: metrics.avgRating,
    reviewCount: metrics.reviewCount,
    verificationStatus: verified ? "VERIFIED" : "DRAFT",
  };
}
