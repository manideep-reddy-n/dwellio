export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081/api/v1",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8081/api/v1/ws",
} as const;

export const AUTH_COOKIE = "dwellio_token";
export const SESSION_COOKIE = "dwellio_session";
/** Align with backend refresh token lifetime (7 days). */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
