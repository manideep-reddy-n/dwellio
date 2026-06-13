import { authApi } from "@/lib/api/auth";
import {
  clearSession as clearPersistedSession,
  getRefreshToken,
  persistSession,
  syncAuthCookieFromStore,
} from "@/lib/auth/session";
import { useAuthStore } from "@/stores/auth-store";

const REFRESH_BUFFER_MS = 60_000;

export async function restoreSession(): Promise<boolean> {
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

  return refreshAccessToken();
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    useAuthStore.getState().clearSession();
    clearPersistedSession();
    return false;
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
    return true;
  } catch {
    useAuthStore.getState().clearSession();
    clearPersistedSession();
    return false;
  }
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
    void refreshAccessToken().then((ok) => {
      if (ok) {
        scheduleAccessTokenRefresh();
      }
    });
  }, delay);

  return () => window.clearTimeout(timer);
}
