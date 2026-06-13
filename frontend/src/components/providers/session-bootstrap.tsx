"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  refreshAccessToken,
  restoreSession,
  scheduleAccessTokenRefresh,
} from "@/lib/auth/restore-session";
import { useAuthStore } from "@/stores/auth-store";

export function SessionBootstrap() {
  const setSessionReady = useAuthStore((s) => s.setSessionReady);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    let cancelRefreshSchedule: (() => void) | undefined;

    async function bootstrap() {
      setSessionReady(false);
      const ok = await restoreSession();
      if (ok) {
        cancelRefreshSchedule = scheduleAccessTokenRefresh();
      }
      setSessionReady(true);
    }

    void bootstrap();

    return () => {
      cancelRefreshSchedule?.();
    };
  }, [hydrated, setSessionReady]);

  return null;
}

export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}

/** Redirect authenticated users away from login/register. */
export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const accessToken = useAuthStore((s) => s.accessToken);
  const expiresAt = useAuthStore((s) => s.expiresAt);

  const authed = Boolean(accessToken && expiresAt && expiresAt > Date.now());

  useEffect(() => {
    if (!hydrated || !sessionReady) return;
    if (authed) {
      router.replace("/app");
    }
  }, [hydrated, sessionReady, authed, router]);

  if (!hydrated || !sessionReady) {
    return (
      <div className="text-center text-sm text-muted-foreground">Loading…</div>
    );
  }

  if (authed) {
    return null;
  }

  return <>{children}</>;
}
