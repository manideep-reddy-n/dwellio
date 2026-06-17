import type { VizFloorNode } from "@/types/api/accommodation";

export function formatFloorLabel(floor: VizFloorNode): string {
  const numberLabel = `Floor ${floor.floorNumber}`;
  const name = floor.name?.trim();
  if (!name || name === numberLabel) {
    return numberLabel;
  }
  return `${numberLabel} — ${name}`;
}
