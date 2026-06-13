import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserResponse } from "@/types/api/auth";

interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  expiresAt: number | null;
  sessionReady: boolean;
  setSession: (user: UserResponse, accessToken: string, expiresInSeconds: number) => void;
  setUser: (user: UserResponse) => void;
  setSessionReady: (ready: boolean) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      expiresAt: null,
      sessionReady: false,

      setSession: (user, accessToken, expiresInSeconds) =>
        set({
          user,
          accessToken,
          expiresAt: Date.now() + expiresInSeconds * 1000,
        }),

      setUser: (user) => set({ user }),

      setSessionReady: (ready) => set({ sessionReady: ready }),

      clearSession: () =>
        set({ user: null, accessToken: null, expiresAt: null }),

      isAuthenticated: () => {
        const { accessToken, expiresAt } = get();
        return Boolean(accessToken && expiresAt && expiresAt > Date.now());
      },
    }),
    {
      name: "dwellio-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        expiresAt: state.expiresAt,
      }),
    },
  ),
);
