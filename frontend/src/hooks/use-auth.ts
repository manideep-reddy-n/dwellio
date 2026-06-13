"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { clearSession, persistSession } from "@/lib/auth/session";
import { refreshAccessToken, scheduleAccessTokenRefresh } from "@/lib/auth/restore-session";
import { useAuthStore } from "@/stores/auth-store";
import type { LoginRequest, RegisterRequest } from "@/types/api/auth";

export function useAuth() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const setSession = useAuthStore((s) => s.setSession);
  const clearAuth = useAuthStore((s) => s.clearSession);

  const isAuthenticated = Boolean(
    accessToken && expiresAt && expiresAt > Date.now(),
  );

  const applyAuthResponse = useCallback(
    (response: Awaited<ReturnType<typeof authApi.login>>) => {
      setSession(response.user, response.accessToken, response.expiresInSeconds);
      persistSession(
        response.accessToken,
        response.refreshToken,
        response.expiresInSeconds,
      );
      scheduleAccessTokenRefresh();
    },
    [setSession],
  );

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await authApi.login(payload);
      applyAuthResponse(response);
      return response;
    },
    [applyAuthResponse],
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const response = await authApi.register(payload);
      applyAuthResponse(response);
      return response;
    },
    [applyAuthResponse],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — clear local session regardless
    }
    clearAuth();
    clearSession();
    useAuthStore.getState().setSessionReady(true);
    router.push("/login");
  }, [clearAuth, router]);

  const refresh = useCallback(async () => refreshAccessToken(), []);

  return {
    user,
    accessToken,
    sessionReady,
    isAuthenticated,
    login,
    register,
    logout,
    refresh,
  };
}
