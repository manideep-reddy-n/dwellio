"use client";

import { useAuthStore } from "@/stores/auth-store";

/** True when session bootstrap finished and a valid access token is available. */
export function useAuthReady() {
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const accessToken = useAuthStore((s) => s.accessToken);
  const expiresAt = useAuthStore((s) => s.expiresAt);

  const authReady = Boolean(
    sessionReady && accessToken && expiresAt && expiresAt > Date.now(),
  );

  return { authReady, sessionReady };
}
