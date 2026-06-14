import type { PublicOrganizationMetrics } from "@/types/api/marketplace";

export function isPropertyFull(metrics: PublicOrganizationMetrics): boolean {
  if (metrics.availableBeds != null && metrics.totalBeds != null) {
    return metrics.totalBeds > 0 && metrics.availableBeds === 0;
  }
  if (metrics.availableUnits != null && metrics.totalUnits != null) {
    return metrics.totalUnits > 0 && metrics.availableUnits === 0;
  }
  return false;
}

export function hasOpenAvailability(metrics: PublicOrganizationMetrics): boolean {
  if (metrics.availableBeds != null) {
    return metrics.availableBeds > 0;
  }
  if (metrics.availableUnits != null) {
    return metrics.availableUnits > 0;
  }
  return false;
}
