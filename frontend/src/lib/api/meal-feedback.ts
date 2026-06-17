import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { MealType } from "@/lib/api/food-menu";

export interface MealFeedback {
  id: string;
  organizationId: string;
  membershipId: string;
  feedbackDate: string;
  mealType: MealType;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MealRatingRankItem {
  mealType: MealType;
  feedbackDate: string;
  avgRating: number;
  ratingCount: number;
}

export interface MealFeedbackSummary {
  avgBreakfastRating: number | null;
  avgLunchRating: number | null;
  avgDinnerRating: number | null;
  weeklyAvgRating: number | null;
  monthlyAvgRating: number | null;
  totalFeedbackCount: number;
  dailyTrend: Array<{ date: string; avgRating: number | null }>;
  bestRatedMeals: MealRatingRankItem[];
  worstRatedMeals: MealRatingRankItem[];
}

export const mealFeedbackApi = {
  upsert: (
    orgId: string,
    body: { mealType: MealType; rating: number; comment?: string; feedbackDate?: string },
  ) =>
    apiRequest<MealFeedback>(apiConfig.baseUrl, `/organizations/${orgId}/meal-feedback`, {
      method: "PUT",
      body,
    }),

  listMine: (orgId: string, date?: string) => {
    const qs = date ? `?date=${date}` : "";
    return apiRequest<MealFeedback[]>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/meal-feedback/mine${qs}`,
    );
  },

  summary: (orgId: string) =>
    apiRequest<MealFeedbackSummary>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/meal-feedback/summary`,
    ),
};
