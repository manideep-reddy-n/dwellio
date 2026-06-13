import { AUTH_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/config/api";

const REFRESH_KEY = "dwellio_refresh_token";

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function setAuthCookie(accessToken: string, maxAgeSeconds: number) {
  setCookie(AUTH_COOKIE, accessToken, maxAgeSeconds);
}

export function setSessionCookie() {
  setCookie(SESSION_COOKIE, "1", SESSION_MAX_AGE_SECONDS);
}

export function clearAuthCookie() {
  clearCookie(AUTH_COOKIE);
}

export function clearSessionCookie() {
  clearCookie(SESSION_COOKIE);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_KEY, token);
}

export function clearRefreshToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFRESH_KEY);
}

export function persistSession(
  accessToken: string,
  refreshToken: string,
  expiresInSeconds: number,
) {
  setAuthCookie(accessToken, expiresInSeconds);
  setSessionCookie();
  setRefreshToken(refreshToken);
}

export function clearSession() {
  clearAuthCookie();
  clearSessionCookie();
  clearRefreshToken();
}

export function syncAuthCookieFromStore(accessToken: string, expiresAt: number) {
  const maxAge = Math.floor((expiresAt - Date.now()) / 1000);
  if (maxAge > 0) {
    setAuthCookie(accessToken, maxAge);
    setSessionCookie();
  }
}
