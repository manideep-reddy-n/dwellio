"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { adminAuthApi } from "@/lib/api/admin-auth";
import {
  clearAdminSessionMarker,
  getAdminDisplayName,
  isPlatformAdminSession,
  persistAdminSessionMarker,
} from "@/lib/auth/admin-session";
import { persistSession, clearSession } from "@/lib/auth/session";
import {
  hasPersistedCredentials,
  refreshAccessToken,
  scheduleAccessTokenRefresh,
} from "@/lib/auth/restore-session";
import { useAuthStore } from "@/stores/auth-store";

export function useAdminAuth() {
  const router = useRouter();
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const setSession = useAuthStore((s) => s.setSession);
  const clearAuth = useAuthStore((s) => s.clearSession);
  const [bootstrapping, setBootstrapping] = useState(true);

  const isAuthenticated =
    sessionReady &&
    isPlatformAdminSession() &&
    (Boolean(accessToken && expiresAt && expiresAt > Date.now()) || hasPersistedCredentials());

  useEffect(() => {
    if (!sessionReady) return;
    setBootstrapping(false);
  }, [sessionReady]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await adminAuthApi.login({ username, password });
    if (!response.user.platformAdmin) {
      throw new Error("Not a platform administrator");
    }
    setSession(response.user, response.accessToken, response.expiresInSeconds);
    persistSession(response.accessToken, response.refreshToken, response.expiresInSeconds);
    persistAdminSessionMarker(response.accessToken);
    scheduleAccessTokenRefresh();
    return response;
  }, [setSession]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // clear local session regardless
    }
    clearAuth();
    clearSession();
    clearAdminSessionMarker();
    useAuthStore.getState().setSessionReady(true);
    router.replace("/admin/login");
  }, [clearAuth, router]);

  const touchActivity = useCallback(() => {
    // Session persistence is driven by refresh tokens, not idle timeout.
  }, []);

  return {
    session: isAuthenticated
      ? {
          accessToken: accessToken ?? "",
          expiresAt: expiresAt ?? 0,
          userName: getAdminDisplayName() ?? user?.fullName ?? "Administrator",
        }
      : null,
    ready: sessionReady && !bootstrapping,
    isAuthenticated,
    login,
    logout,
    touchActivity,
  };
}

/** Restore admin session after page load when refresh token exists. */
export async function ensureAdminSession(): Promise<boolean> {
  if (!hasPersistedCredentials()) {
    return false;
  }
  const state = useAuthStore.getState();
  if (state.accessToken && state.expiresAt && state.expiresAt > Date.now() && isPlatformAdminSession()) {
    persistAdminSessionMarker(state.accessToken);
    return true;
  }
  const result = await refreshAccessToken();
  if (result.ok && isPlatformAdminSession()) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      persistAdminSessionMarker(token);
    }
    scheduleAccessTokenRefresh();
    return true;
  }
  return false;
}
