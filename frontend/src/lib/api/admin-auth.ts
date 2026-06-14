import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { AuthResponse } from "@/types/api/auth";

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export const adminAuthApi = {
  login: (body: AdminLoginRequest) =>
    apiRequest<AuthResponse>(apiConfig.baseUrl, "/auth/admin/login", {
      method: "POST",
      body,
      skipAuth: true,
    }),
};
