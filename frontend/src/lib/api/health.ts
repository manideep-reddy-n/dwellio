import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";

export const healthApi = {
  check: () =>
    apiRequest<{ status: string }>(apiConfig.baseUrl, "/health", { skipAuth: true }),
};
