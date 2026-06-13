import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  sidebarCollapsed: boolean;
  reducedMotion: boolean;
  commandPaletteOpen: boolean;
  toggleSidebar: () => void;
  setReducedMotion: (value: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      reducedMotion: false,
      commandPaletteOpen: false,

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setReducedMotion: (value) => set({ reducedMotion: value }),

      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      toggleCommandPalette: () =>
        set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
    }),
    {
      name: "dwellio-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        reducedMotion: state.reducedMotion,
      }),
    },
  ),
);
