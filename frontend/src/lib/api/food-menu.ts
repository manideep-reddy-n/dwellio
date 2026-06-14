import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

export interface FoodMenuMeal {
  mealType: MealType;
  items: string;
  overridden: boolean;
}

export interface FoodMenuDay {
  dayOfWeek: number;
  dayLabel: string;
  meals: FoodMenuMeal[];
}

export interface TodayMenu {
  date: string;
  dayLabel: string;
  meals: FoodMenuMeal[];
}

export const foodMenuApi = {
  weekly: (orgId: string) =>
    apiRequest<FoodMenuDay[]>(apiConfig.baseUrl, `/organizations/${orgId}/food-menu/weekly`),

  today: (orgId: string) =>
    apiRequest<TodayMenu>(apiConfig.baseUrl, `/organizations/${orgId}/food-menu/today`),

  updateWeekly: (
    orgId: string,
    body: { dayOfWeek: number; mealType: MealType; items: string },
  ) =>
    apiRequest<FoodMenuDay>(apiConfig.baseUrl, `/organizations/${orgId}/food-menu/weekly`, {
      method: "PATCH",
      body,
    }),

  updateToday: (orgId: string, body: { mealType: MealType; items: string }) =>
    apiRequest<TodayMenu>(apiConfig.baseUrl, `/organizations/${orgId}/food-menu/today`, {
      method: "PATCH",
      body,
    }),
};
