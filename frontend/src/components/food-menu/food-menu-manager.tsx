"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { foodMenuApi, type MealType } from "@/lib/api/food-menu";
import { queryKeys } from "@/lib/query/keys";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { toast } from "sonner";

const MEALS: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];

interface FoodMenuManagerProps {
  orgId: string;
}

export function FoodMenuManager({ orgId }: FoodMenuManagerProps) {
  const { authReady } = useAuthReady();
  const queryClient = useQueryClient();
  const { data: weekly = [], isLoading } = useQuery({
    queryKey: [...queryKeys.foodMenu(orgId), "weekly"],
    queryFn: () => foodMenuApi.weekly(orgId),
    enabled: authReady && Boolean(orgId),
  });
  const { data: today } = useQuery({
    queryKey: [...queryKeys.foodMenu(orgId), "today"],
    queryFn: () => foodMenuApi.today(orgId),
    enabled: authReady && Boolean(orgId),
  });

  const [selectedDay, setSelectedDay] = useState(1);
  const [weeklyEdits, setWeeklyEdits] = useState<Record<string, string>>({});
  const [todayEdits, setTodayEdits] = useState<Record<string, string>>({});

  const saveWeekly = useMutation({
    mutationFn: (mealType: MealType) =>
      foodMenuApi.updateWeekly(orgId, {
        dayOfWeek: selectedDay,
        mealType,
        items: weeklyEdits[mealType] ?? "",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.foodMenu(orgId) });
      toast.success("Weekly menu saved");
    },
    onError: () => toast.error("Could not save weekly menu"),
  });

  const saveToday = useMutation({
    mutationFn: (mealType: MealType) =>
      foodMenuApi.updateToday(orgId, {
        mealType,
        items: todayEdits[mealType] ?? "",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.foodMenu(orgId) });
      toast.success("Today's menu updated — residents notified");
    },
    onError: () => toast.error("Could not update today's menu"),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  const day = weekly.find((d) => d.dayOfWeek === selectedDay);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Day</Label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
            >
              {weekly.map((d) => (
                <option key={d.dayOfWeek} value={d.dayOfWeek}>
                  {d.dayLabel}
                </option>
              ))}
            </select>
          </div>
          {MEALS.map((meal) => {
            const existing = day?.meals.find((m) => m.mealType === meal)?.items ?? "";
            return (
              <div key={meal}>
                <Label className="capitalize">{meal.toLowerCase()}</Label>
                <Textarea
                  rows={2}
                  defaultValue={existing}
                  onChange={(e) =>
                    setWeeklyEdits((prev) => ({ ...prev, [meal]: e.target.value }))
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1"
                  disabled={saveWeekly.isPending}
                  onClick={() => saveWeekly.mutate(meal)}
                >
                  Save {meal.toLowerCase()}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today only override</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Changes here apply only to today ({today?.dayLabel}). Weekly template stays unchanged.
          </p>
          {MEALS.map((meal) => {
            const existing = today?.meals.find((m) => m.mealType === meal)?.items ?? "";
            return (
              <div key={meal}>
                <Label className="capitalize">{meal.toLowerCase()}</Label>
                <Textarea
                  rows={2}
                  defaultValue={existing}
                  onChange={(e) => setTodayEdits((prev) => ({ ...prev, [meal]: e.target.value }))}
                />
                <Button
                  size="sm"
                  className="mt-1"
                  disabled={saveToday.isPending}
                  onClick={() => saveToday.mutate(meal)}
                >
                  Update today&apos;s {meal.toLowerCase()}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
