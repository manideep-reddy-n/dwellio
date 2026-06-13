import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type {
  AuthResponse,
  LoginRequest,
  MessageResponse,
  RefreshTokenRequest,
  RegisterRequest,
  UserResponse,
} from "@/types/api/auth";

const base = apiConfig.baseUrl;

export const authApi = {
  register: (body: RegisterRequest) =>
    apiRequest<AuthResponse>(base, "/auth/register", {
      method: "POST",
      body,
      skipAuth: true,
    }),

  login: (body: LoginRequest) =>
    apiRequest<AuthResponse>(base, "/auth/login", {
      method: "POST",
      body,
      skipAuth: true,
    }),

  refresh: (body: RefreshTokenRequest) =>
    apiRequest<AuthResponse>(base, "/auth/refresh", {
      method: "POST",
      body,
      skipAuth: true,
    }),

  logout: () =>
    apiRequest<void>(base, "/auth/logout", { method: "POST" }),

  me: () => apiRequest<UserResponse>(base, "/auth/me"),

  forgotPassword: (email: string) =>
    apiRequest<MessageResponse>(base, "/auth/forgot-password", {
      method: "POST",
      body: { email },
      skipAuth: true,
    }),
};
