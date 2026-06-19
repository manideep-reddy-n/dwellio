import { ADMIN_SESSION_COOKIE, ADMIN_TOKEN_COOKIE } from "@/config/admin";
import { SESSION_MAX_AGE_SECONDS } from "@/config/api";
import { useAuthStore } from "@/stores/auth-store";

function cookieOptions(maxAgeSeconds: number): string {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  return `Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

/** Mark admin console session for layout checks (tokens live in the shared auth store). */
export function persistAdminSessionMarker(accessToken: string): void {
  if (typeof window === "undefined") return;
  document.cookie = `${ADMIN_SESSION_COOKIE}=1; ${cookieOptions(SESSION_MAX_AGE_SECONDS)}`;
  document.cookie = `${ADMIN_TOKEN_COOKIE}=${encodeURIComponent(accessToken)}; ${cookieOptions(SESSION_MAX_AGE_SECONDS)}`;
}

export function clearAdminSessionMarker(): void {
  if (typeof window === "undefined") return;
  document.cookie = `${ADMIN_SESSION_COOKIE}=; Path=/; Max-Age=0`;
  document.cookie = `${ADMIN_TOKEN_COOKIE}=; Path=/; Max-Age=0`;
}

export function isPlatformAdminSession(): boolean {
  const { user } = useAuthStore.getState();
  return Boolean(user?.platformAdmin);
}

export function getAdminDisplayName(): string | null {
  return useAuthStore.getState().user?.fullName ?? null;
}

export function hasAdminSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${ADMIN_SESSION_COOKIE}=`);
}
