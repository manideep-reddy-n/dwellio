"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useMealFeedbackSummary } from "@/hooks/use-meal-feedback";
import { formatDate } from "@/lib/format/datetime";
import type { MealType } from "@/lib/api/food-menu";

const mealLabels: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

interface MealAnalyticsPanelProps {
  orgId: string;
}

export function MealAnalyticsPanel({ orgId }: MealAnalyticsPanelProps) {
  const { data, isLoading, isError, refetch } = useMealFeedbackSummary(orgId);

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data || data.totalFeedbackCount === 0) {
    return (
      <EmptyState
        title="No meal feedback yet"
        description="Ratings from residents will appear here once they review today's meals."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Breakfast avg</p>
            <p className="text-xl font-bold">{formatRating(data.avgBreakfastRating)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Lunch avg</p>
            <p className="text-xl font-bold">{formatRating(data.avgLunchRating)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Dinner avg</p>
            <p className="text-xl font-bold">{formatRating(data.avgDinnerRating)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">7-day avg</p>
            <p className="text-xl font-bold">{formatRating(data.weeklyAvgRating)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">30-day avg</p>
            <p className="text-xl font-bold">{formatRating(data.monthlyAvgRating)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankList title="Best rated meals" items={data.bestRatedMeals} />
        <RankList title="Needs improvement" items={data.worstRatedMeals} />
      </div>
    </div>
  );
}

function RankList({
  title,
  items,
}: {
  title: string;
  items: Array<{ mealType: MealType; feedbackDate: string; avgRating: number; ratingCount: number }>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enough data yet.</p>
        ) : (
          items.map((item) => (
            <div
              key={`${item.mealType}-${item.feedbackDate}`}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{mealLabels[item.mealType]}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(item.feedbackDate)} · {item.ratingCount} rating
                  {item.ratingCount === 1 ? "" : "s"}
                </p>
              </div>
              <p className="font-semibold">{item.avgRating.toFixed(1)} ★</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function formatRating(value: number | null | undefined) {
  return value != null ? `${value.toFixed(1)} ★` : "—";
}
