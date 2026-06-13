import { create } from "zustand";
import type { VizCommandCenterState } from "@/types/accommodation/viz-overlays";
import { DEFAULT_COMMAND_CENTER } from "@/types/accommodation/viz-overlays";

interface VizState {
  selectedBuildingId: string | null;
  selectedFloorId: string | null;
  selectedSpaceId: string | null;
  commandCenter: VizCommandCenterState;
  setSelectedBuilding: (id: string | null) => void;
  setSelectedFloor: (id: string | null) => void;
  setSelectedSpace: (id: string | null) => void;
  setCommandCenter: (partial: Partial<VizCommandCenterState>) => void;
  toggleOverlayLayer: (layer: VizCommandCenterState["activeLayers"][number]) => void;
  reset: () => void;
}

export const useVizStore = create<VizState>((set) => ({
  selectedBuildingId: null,
  selectedFloorId: null,
  selectedSpaceId: null,
  commandCenter: DEFAULT_COMMAND_CENTER,

  setSelectedBuilding: (id) =>
    set({ selectedBuildingId: id, selectedFloorId: null, selectedSpaceId: null }),

  setSelectedFloor: (id) => set({ selectedFloorId: id, selectedSpaceId: null }),

  setSelectedSpace: (id) => set({ selectedSpaceId: id }),

  setCommandCenter: (partial) =>
    set((s) => ({ commandCenter: { ...s.commandCenter, ...partial } })),

  toggleOverlayLayer: (layer) =>
    set((s) => {
      const active = s.commandCenter.activeLayers;
      const next = active.includes(layer)
        ? active.filter((l) => l !== layer)
        : [...active, layer];
      return {
        commandCenter: { ...s.commandCenter, activeLayers: next },
      };
    }),

  reset: () =>
    set({
      selectedBuildingId: null,
      selectedFloorId: null,
      selectedSpaceId: null,
      commandCenter: DEFAULT_COMMAND_CENTER,
    }),
}));
