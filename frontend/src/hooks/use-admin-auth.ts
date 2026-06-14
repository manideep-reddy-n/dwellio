"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAuthApi } from "@/lib/api/admin-auth";
import {
  clearAdminSession,
  getAdminSession,
  isAdminSessionExpired,
  persistAdminSession,
  touchAdminActivity,
  type AdminSession,
} from "@/lib/auth/admin-session";

export function useAdminAuth() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    if (isAdminSessionExpired()) {
      clearAdminSession();
      setSession(null);
      return;
    }
    setSession(getAdminSession());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  useEffect(() => {
    if (!session) return;

    const onActivity = () => touchAdminActivity();
    const events = ["mousedown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const interval = window.setInterval(() => {
      if (isAdminSessionExpired()) {
        clearAdminSession();
        setSession(null);
        router.replace("/admin/login");
      }
    }, 60_000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      window.clearInterval(interval);
    };
  }, [session, router]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await adminAuthApi.login({ username, password });
    const adminSession: AdminSession = {
      accessToken: response.accessToken,
      expiresAt: Date.now() + response.expiresInSeconds * 1000,
      userName: response.user.fullName,
    };
    persistAdminSession(adminSession);
    setSession(adminSession);
    return response;
  }, []);

  const logout = useCallback(() => {
    clearAdminSession();
    setSession(null);
    router.replace("/admin/login");
  }, [router]);

  return {
    session,
    ready,
    isAuthenticated: Boolean(session),
    login,
    logout,
    touchActivity: touchAdminActivity,
  };
}
