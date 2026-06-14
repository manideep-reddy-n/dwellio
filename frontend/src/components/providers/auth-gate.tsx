"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthHydrated } from "@/components/providers/session-bootstrap";
import { getRefreshToken } from "@/lib/auth/session";
import { isRefreshInFlight } from "@/lib/auth/restore-session";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Protects /app routes without replacing the SSR tree (avoids hydration mismatch).
 * Shows a loading overlay after mount while session restores.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const hydrated = useAuthHydrated();
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const accessToken = useAuthStore((s) => s.accessToken);
  const expiresAt = useAuthStore((s) => s.expiresAt);

  const authed = Boolean(accessToken && expiresAt && expiresAt > Date.now());
  const hasRefresh = Boolean(getRefreshToken());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !hydrated || !sessionReady) return;
    if (isRefreshInFlight()) return;
    if (!authed && !hasRefresh) {
      router.replace("/login");
    }
  }, [mounted, hydrated, sessionReady, authed, hasRefresh, router]);

  const booting = mounted && (!hydrated || !sessionReady);
  const blocked = mounted && hydrated && sessionReady && !authed && !hasRefresh;

  if (blocked) {
    return null;
  }

  return (
    <>
      {booting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="text-sm text-muted-foreground">Restoring session…</p>
        </div>
      )}
      {children}
    </>
  );
}
