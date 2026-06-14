"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { foodMenuApi } from "@/lib/api/food-menu";
import { queryKeys } from "@/lib/query/keys";
import { useAuthReady } from "@/hooks/use-auth-ready";

interface TodayMenuCardProps {
  orgId: string | undefined;
  title?: string;
}

export function TodayMenuCard({ orgId, title = "Today's menu" }: TodayMenuCardProps) {
  const { authReady } = useAuthReady();
  const { data, isLoading } = useQuery({
    queryKey: orgId ? queryKeys.foodMenu(orgId) : ["food-menu", "disabled"],
    queryFn: () => foodMenuApi.today(orgId!),
    enabled: authReady && Boolean(orgId),
  });

  if (!orgId) return null;
  if (isLoading) return <Skeleton className="h-36 w-full rounded-xl" />;
  if (!data) return null;

  const hasItems = data.meals.some((m) => m.items.trim().length > 0);
  if (!hasItems) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {title} · {data.dayLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {data.meals.map((meal) => (
          <div key={meal.mealType}>
            <p className="font-medium capitalize">
              {meal.mealType.toLowerCase()}
              {meal.overridden && (
                <span className="ml-2 text-xs font-normal text-amber-600">special today</span>
              )}
            </p>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {meal.items.trim() || "—"}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
