import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { CreateReviewInput, Review, UpdateReviewInput } from "@/types/api/review";

export const reviewsApi = {
  list: (orgId: string) =>
    apiRequest<Review[]>(apiConfig.baseUrl, `/organizations/${orgId}/reviews`),

  getMine: (orgId: string) =>
    apiRequest<Review>(apiConfig.baseUrl, `/organizations/${orgId}/reviews/mine`),

  create: (orgId: string, body: CreateReviewInput) =>
    apiRequest<Review>(apiConfig.baseUrl, `/organizations/${orgId}/reviews`, {
      method: "POST",
      body,
    }),

  updateMine: (orgId: string, body: UpdateReviewInput) =>
    apiRequest<Review>(apiConfig.baseUrl, `/organizations/${orgId}/reviews/mine`, {
      method: "PUT",
      body,
    }),

  report: (orgId: string, reviewId: string, reason: string) =>
    apiRequest<void>(apiConfig.baseUrl, `/organizations/${orgId}/reviews/${reviewId}/reports`, {
      method: "POST",
      body: { reason },
    }),
};
