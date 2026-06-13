import { create } from "zustand";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

interface WebSocketState {
  status: ConnectionStatus;
  lastConnectedAt: number | null;
  subscribedOrgId: string | null;
  setStatus: (status: ConnectionStatus) => void;
  setSubscribedOrgId: (orgId: string | null) => void;
}

export const useWebSocketStore = create<WebSocketState>((set) => ({
  status: "idle",
  lastConnectedAt: null,
  subscribedOrgId: null,

  setStatus: (status) =>
    set((s) => ({
      status,
      lastConnectedAt: status === "connected" ? Date.now() : s.lastConnectedAt,
    })),

  setSubscribedOrgId: (orgId) => set({ subscribedOrgId: orgId }),
}));
