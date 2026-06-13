import type { BedStatus, SpaceStatus } from "@/types/api/accommodation";

export const spaceStatusColors: Record<SpaceStatus, string> = {
  AVAILABLE: "bg-emerald-500/90 border-emerald-600",
  PARTIALLY_OCCUPIED: "bg-amber-400/90 border-amber-500",
  OCCUPIED: "bg-sky-500/90 border-sky-600",
  BLOCKED: "bg-zinc-400/90 border-zinc-500",
};

export const bedStatusColors: Record<BedStatus, string> = {
  AVAILABLE: "bg-emerald-500/90 border-emerald-600",
  OCCUPIED: "bg-sky-500/90 border-sky-600",
  BLOCKED: "bg-zinc-400/90 border-zinc-500",
};

export const spaceStatusLabels: Record<SpaceStatus, string> = {
  AVAILABLE: "Available",
  PARTIALLY_OCCUPIED: "Partial",
  OCCUPIED: "Occupied",
  BLOCKED: "Blocked",
};

export const bedStatusLabels: Record<BedStatus, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  BLOCKED: "Blocked",
};
