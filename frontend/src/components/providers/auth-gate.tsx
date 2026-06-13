"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthHydrated } from "@/components/providers/session-bootstrap";
import { getRefreshToken } from "@/lib/auth/session";
import { useAuthStore } from "@/stores/auth-store";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const accessToken = useAuthStore((s) => s.accessToken);
  const expiresAt = useAuthStore((s) => s.expiresAt);

  const authed = Boolean(accessToken && expiresAt && expiresAt > Date.now());

  useEffect(() => {
    if (!hydrated || !sessionReady) return;
    if (!authed && !getRefreshToken()) {
      router.replace("/login");
    }
  }, [hydrated, sessionReady, authed, router]);

  if (!hydrated || !sessionReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Restoring session…
      </div>
    );
  }

  if (!authed && !getRefreshToken()) {
    return null;
  }

  return <>{children}</>;
}
