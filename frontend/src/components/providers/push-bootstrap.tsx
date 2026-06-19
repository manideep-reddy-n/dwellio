"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { pushApi } from "@/lib/api/push";
import { registerBrowserPush } from "@/lib/push/register-push";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Silently registers browser push when the user is signed in and permission
 * was already granted (e.g. after a previous "Enable browser push" click).
 */
export function PushBootstrap() {
  const pathname = usePathname();
  const accessToken = useAuthStore((s) => s.accessToken);
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const attempted = useRef(false);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    if (!sessionReady || !accessToken || attempted.current) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "granted") return;

    attempted.current = true;

    void (async () => {
      try {
        const config = await pushApi.config();
        if (!config.pushConfigured || !config.vapidPublicKey) return;
        await registerBrowserPush();
      } catch {
        // Push is optional; ignore bootstrap failures.
      }
    })();
  }, [pathname, accessToken, sessionReady]);

  return null;
}
