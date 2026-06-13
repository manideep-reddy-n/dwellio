export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string | null;
  skipAuth?: boolean;
}

type TokenGetter = () => string | null;
type RefreshHandler = () => Promise<string | null>;
type AuthFailureHandler = () => void;

let getAccessToken: TokenGetter = () => null;
let refreshAccessToken: RefreshHandler = async () => null;
let onAuthFailure: AuthFailureHandler = () => {};

export function configureApiAuth(
  tokenGetter: TokenGetter,
  refreshHandler: RefreshHandler,
) {
  getAccessToken = tokenGetter;
  refreshAccessToken = refreshHandler;
}

export function configureAuthFailure(handler: AuthFailureHandler) {
  onAuthFailure = handler;
}

export async function apiRequest<T>(
  baseUrl: string,
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, token, skipAuth, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const accessToken = token ?? (skipAuth ? null : getAccessToken());
  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !skipAuth && !token) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(baseUrl, path, { ...options, token: refreshed });
    }
    onAuthFailure();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof (payload as { message: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
