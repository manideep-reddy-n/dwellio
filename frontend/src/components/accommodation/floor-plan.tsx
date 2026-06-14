"use client";

import { CommunityBlueprint } from "@/components/accommodation/community-blueprint";
import type { AccommodationVisualization } from "@/types/api/accommodation";

interface FloorPlanProps {
  visualization: AccommodationVisualization;
  propertyName?: string;
  allowLayoutEdit?: boolean;
  highlightBedId?: string | null;
  highlightSpaceId?: string | null;
  onLayoutSave?: Parameters<typeof CommunityBlueprint>[0]["onLayoutSave"];
}

/** Read-only resident/owner preview blueprint */
export function FloorPlan(props: FloorPlanProps) {
  return <CommunityBlueprint {...props} />;
}
