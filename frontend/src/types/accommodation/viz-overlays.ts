/**
 * Overlay layer architecture for building visualization (V1: 2D only).
 *
 * V1 renders base floor plan from accommodation/visualization API.
 * Future phases attach overlay providers without changing the core tree:
 *
 * - complaint overlays (open complaints per space/bed)
 * - occupancy overlays (live move-in/out highlights)
 * - asset overlays (maintenance status per asset)
 * - command-center mode (aggregated ops panel + multi-layer toggle)
 */

export type VizOverlayLayer =
  | "base"
  | "occupancy"
  | "complaints"
  | "assets"
  | "command-center";

export type VizOverlaySeverity = "info" | "warning" | "critical";

export interface VizOverlayItem {
  id: string;
  layer: Exclude<VizOverlayLayer, "base" | "command-center">;
  targetType: "building" | "floor" | "space" | "bed";
  targetId: string;
  label: string;
  severity: VizOverlaySeverity;
  href?: string;
  metadata?: Record<string, unknown>;
}

export interface VizCommandCenterState {
  enabled: boolean;
  activeLayers: VizOverlayLayer[];
  pinnedSpaceId: string | null;
  pinnedBedId: string | null;
}

export const DEFAULT_COMMAND_CENTER: VizCommandCenterState = {
  enabled: false,
  activeLayers: ["base", "occupancy"],
  pinnedSpaceId: null,
  pinnedBedId: null,
};

export interface VizOverlayProvider {
  layer: VizOverlayLayer;
  /** Fetch overlay items for the current org + building context. */
  fetchOverlays: (orgId: string, buildingId: string) => Promise<VizOverlayItem[]>;
}
