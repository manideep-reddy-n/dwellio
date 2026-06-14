import { ADMIN_IDLE_MS, ADMIN_SESSION_COOKIE, ADMIN_TOKEN_COOKIE } from "@/config/admin";

const LAST_ACTIVITY_KEY = "dwellio_admin_last_activity";

export interface AdminSession {
  accessToken: string;
  expiresAt: number;
  userName: string;
}

function cookieOptions(maxAgeSeconds: number): string {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  return `Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

export function persistAdminSession(session: AdminSession): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(session);
  document.cookie = `${ADMIN_SESSION_COOKIE}=1; ${cookieOptions(Math.floor(ADMIN_IDLE_MS / 1000))}`;
  document.cookie = `${ADMIN_TOKEN_COOKIE}=${encodeURIComponent(session.accessToken)}; ${cookieOptions(Math.floor(ADMIN_IDLE_MS / 1000))}`;
  sessionStorage.setItem(ADMIN_SESSION_COOKIE, payload);
  touchAdminActivity();
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(ADMIN_SESSION_COOKIE);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AdminSession;
    if (!session.accessToken || !session.expiresAt) return null;
    if (isAdminSessionExpired()) {
      clearAdminSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function touchAdminActivity(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function isAdminSessionExpired(): boolean {
  if (typeof window === "undefined") return true;
  const last = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY) ?? "0");
  if (!last) return true;
  return Date.now() - last > ADMIN_IDLE_MS;
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  document.cookie = `${ADMIN_SESSION_COOKIE}=; Path=/; Max-Age=0`;
  document.cookie = `${ADMIN_TOKEN_COOKIE}=; Path=/; Max-Age=0`;
  sessionStorage.removeItem(ADMIN_SESSION_COOKIE);
  sessionStorage.removeItem(LAST_ACTIVITY_KEY);
}

export function hasAdminSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${ADMIN_SESSION_COOKIE}=`);
}
