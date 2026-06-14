import type { BedStatus, SpaceStatus } from "@/types/api/accommodation";

export const previewSpaceStyles: Record<SpaceStatus, string> = {
  AVAILABLE: "border border-emerald-200 bg-emerald-50/90 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
  PARTIALLY_OCCUPIED: "border border-amber-200 bg-amber-50/90 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  OCCUPIED: "border border-sky-200 bg-sky-50/90 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100",
  BLOCKED: "border border-zinc-200 bg-zinc-100/90 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/40",
};

export const previewBedStyles: Record<BedStatus, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  OCCUPIED: "bg-sky-100 text-sky-800 border border-sky-200",
  BLOCKED: "bg-zinc-100 text-zinc-600 border border-zinc-200",
};

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
