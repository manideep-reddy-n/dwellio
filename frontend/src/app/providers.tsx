"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { StompProvider } from "@/components/providers/stomp-provider";
import { SessionBootstrap } from "@/components/providers/session-bootstrap";
import { configureApiAuth, configureAuthFailure } from "@/lib/api/client";
import { refreshAccessToken } from "@/lib/auth/restore-session";
import { clearSession } from "@/lib/auth/session";
import { queryDefaults } from "@/lib/query/defaults";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: queryDefaults.staleTime.static,
        gcTime: queryDefaults.gcTime,
        retry: queryDefaults.retry,
        refetchOnWindowFocus: true,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

function ApiAuthBootstrap() {
  const clearAuth = useAuthStore((s) => s.clearSession);
  const setSessionReady = useAuthStore((s) => s.setSessionReady);

  useEffect(() => {
    configureApiAuth(
      () => useAuthStore.getState().accessToken,
      async () => {
        const refreshed = await refreshAccessToken();
        return refreshed ? useAuthStore.getState().accessToken : null;
      },
    );

    configureAuthFailure(() => {
      clearAuth();
      clearSession();
      setSessionReady(true);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    });
  }, [clearAuth, setSessionReady]);

  return null;
}

function ReducedMotionBootstrap() {
  const setReducedMotion = useUiStore((s) => s.setReducedMotion);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const handler = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [setReducedMotion]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <ApiAuthBootstrap />
        <SessionBootstrap />
        <ReducedMotionBootstrap />
        <StompProvider>{children}</StompProvider>
        <Toaster richColors closeButton position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
