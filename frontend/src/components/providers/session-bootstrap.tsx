"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ensureMiddlewareSessionCookie,
  hasPersistedCredentials,
  restoreSession,
  scheduleAccessTokenRefresh,
} from "@/lib/auth/restore-session";
import { getRefreshToken } from "@/lib/auth/session";
import { useAuthStore } from "@/stores/auth-store";

export function SessionBootstrap() {
  const setSessionReady = useRef(false);
  const setSessionReadyFn = useAuthStore((s) => s.setSessionReady);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    let cancelRefreshSchedule: (() => void) | undefined;

    async function bootstrap() {
      ensureMiddlewareSessionCookie();
      setSessionReadyFn(false);
      const ok = await restoreSession();
      if (ok) {
        cancelRefreshSchedule = scheduleAccessTokenRefresh();
      }
      setSessionReadyFn(true);
    }

    void bootstrap();

    return () => {
      cancelRefreshSchedule?.();
    };
  }, [setSessionReadyFn]);

  return null;
}

export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      ensureMiddlewareSessionCookie();
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => {
      ensureMiddlewareSessionCookie();
      setHydrated(true);
    });
  }, []);

  return hydrated;
}

/** Redirect authenticated users away from login/register. */
export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const hydrated = useAuthHydrated();
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const accessToken = useAuthStore((s) => s.accessToken);
  const expiresAt = useAuthStore((s) => s.expiresAt);

  const authed = Boolean(accessToken && expiresAt && expiresAt > Date.now());

  useEffect(() => {
    if (!hydrated || !sessionReady) return;
    if (authed) {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") ?? "/app";
      window.location.assign(next);
    }
  }, [hydrated, sessionReady, authed]);

  if (!hydrated || !sessionReady) {
    return (
      <div className="text-center text-sm text-muted-foreground">Loading…</div>
    );
  }

  if (authed) {
    return (
      <div className="text-center text-sm text-muted-foreground">Redirecting…</div>
    );
  }

  return <>{children}</>;
}

export function useHasAuthSession(): boolean {
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const accessToken = useAuthStore((s) => s.accessToken);
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const authed = Boolean(accessToken && expiresAt && expiresAt > Date.now());
  return sessionReady ? authed || hasPersistedCredentials() : hasPersistedCredentials();
}
