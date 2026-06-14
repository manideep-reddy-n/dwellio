import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import {
  clearSession as clearPersistedSession,
  getRefreshToken,
  persistSession,
  setSessionCookie,
  syncAuthCookieFromStore,
} from "@/lib/auth/session";
import { useAuthStore } from "@/stores/auth-store";

const REFRESH_BUFFER_MS = 60_000;

/** Prevent concurrent refresh calls — backend rotates tokens, so a race logs the user out. */
let refreshInFlight: Promise<RefreshResult> | null = null;

export type RefreshResult =
  | { ok: true }
  | { ok: false; reason: "auth" | "transient" };

function isAuthRefreshFailure(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

/**
 * If a refresh token exists, set the long-lived session cookie so middleware
 * allows /app before the async refresh completes.
 */
export function ensureMiddlewareSessionCookie(): void {
  if (getRefreshToken()) {
    setSessionCookie();
  }
}

export async function restoreSession(): Promise<boolean> {
  ensureMiddlewareSessionCookie();

  const state = useAuthStore.getState();

  if (state.accessToken && state.expiresAt && state.expiresAt > Date.now()) {
    syncAuthCookieFromStore(state.accessToken, state.expiresAt);
    return true;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    state.clearSession();
    clearPersistedSession();
    return false;
  }

  const result = await refreshAccessToken();
  return result.ok;
}

export async function refreshAccessToken(): Promise<RefreshResult> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async (): Promise<RefreshResult> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      useAuthStore.getState().clearSession();
      clearPersistedSession();
      return { ok: false, reason: "auth" };
    }

    try {
      const response = await authApi.refresh({ refreshToken });
      const state = useAuthStore.getState();
      state.setSession(response.user, response.accessToken, response.expiresInSeconds);
      persistSession(
        response.accessToken,
        response.refreshToken,
        response.expiresInSeconds,
      );
      return { ok: true };
    } catch (error) {
      if (isAuthRefreshFailure(error)) {
        useAuthStore.getState().clearSession();
        clearPersistedSession();
        return { ok: false, reason: "auth" };
      }
      return { ok: false, reason: "transient" };
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export function isRefreshInFlight(): boolean {
  return refreshInFlight != null;
}

export function scheduleAccessTokenRefresh(): () => void {
  const state = useAuthStore.getState();
  if (!state.expiresAt) {
    return () => {};
  }

  const delay = state.expiresAt - Date.now() - REFRESH_BUFFER_MS;
  if (delay <= 0) {
    void refreshAccessToken();
    return () => {};
  }

  const timer = window.setTimeout(() => {
    void refreshAccessToken().then((result) => {
      if (result.ok) {
        scheduleAccessTokenRefresh();
      }
    });
  }, delay);

  return () => window.clearTimeout(timer);
}

export function hasPersistedCredentials(): boolean {
  const { accessToken, expiresAt } = useAuthStore.getState();
  if (accessToken && expiresAt && expiresAt > Date.now()) {
    return true;
  }
  return Boolean(getRefreshToken());
}
