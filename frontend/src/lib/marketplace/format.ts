import type { TrustScoreInput } from "@/lib/marketplace/trust-score";
import type { PublicOrganizationMetrics } from "@/types/api/marketplace";
import type { OrganizationType } from "@/types/enums";

export const orgTypeLabels: Record<OrganizationType, string> = {
  HOSTEL: "Hostel",
  PG: "PG",
  CO_LIVING: "Co-living",
  GATED_COMMUNITY: "Gated community",
};

export function trustInputFromMetrics(
  metrics: PublicOrganizationMetrics,
  verified = false,
): TrustScoreInput {
  return {
    avgFirstResponseHours: metrics.avgFirstResponseHours,
    resolutionRate: metrics.resolutionRate,
    avgRating: metrics.avgRating,
    reviewCount: metrics.reviewCount,
    verificationStatus: verified ? "VERIFIED" : "DRAFT",
  };
}

export function formatAvailability(metrics: PublicOrganizationMetrics): string {
  if (metrics.availableBeds != null && metrics.totalBeds != null) {
    return `${metrics.availableBeds} of ${metrics.totalBeds} beds available`;
  }
  if (metrics.availableUnits != null && metrics.totalUnits != null) {
    return `${metrics.availableUnits} of ${metrics.totalUnits} units available`;
  }
  return "Availability updating";
}

export function formatRating(avgRating: number | null, reviewCount: number): string {
  if (avgRating == null || reviewCount === 0) {
    return "No reviews yet";
  }
  return `${avgRating.toFixed(1)} (${reviewCount} review${reviewCount === 1 ? "" : "s"})`;
}

export function formatLocation(city: string, area: string | null): string {
  return area ? `${area}, ${city}` : city;
}

export function formatResponseTime(hours: number | null): string {
  if (hours == null) return "—";
  if (hours < 1) return "< 1 hr avg response";
  if (hours < 24) return `${Math.round(hours)} hr avg response`;
  return `${(hours / 24).toFixed(1)} day avg response`;
}
