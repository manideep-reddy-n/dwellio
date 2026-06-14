"use client";

import { UtensilsCrossed } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { foodMenuApi, type FoodMenuDay, type MealType } from "@/lib/api/food-menu";
import { queryKeys } from "@/lib/query/keys";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { cn } from "@/lib/utils";
import type { OrganizationType } from "@/types/enums";

const MEALS: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];
const FOOD_ORG_TYPES: OrganizationType[] = ["HOSTEL", "PG"];

const mealLabels: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

function mealItems(day: FoodMenuDay | undefined, meal: MealType): string {
  return day?.meals.find((m) => m.mealType === meal)?.items?.trim() ?? "";
}

interface ResidentMenuCardProps {
  orgId: string | undefined;
  organizationType?: OrganizationType;
}

export function ResidentMenuCard({ orgId, organizationType }: ResidentMenuCardProps) {
  const { authReady } = useAuthReady();
  const supportsFoodMenu =
    organizationType != null && FOOD_ORG_TYPES.includes(organizationType);
  const { data: today, isLoading: todayLoading } = useQuery({
    queryKey: orgId ? [...queryKeys.foodMenu(orgId), "today"] : ["food-menu", "disabled"],
    queryFn: () => foodMenuApi.today(orgId!),
    enabled: authReady && Boolean(orgId) && supportsFoodMenu,
  });

  const { data: weekly = [], isLoading: weeklyLoading } = useQuery({
    queryKey: orgId ? [...queryKeys.foodMenu(orgId), "weekly"] : ["food-menu", "disabled"],
    queryFn: () => foodMenuApi.weekly(orgId!),
    enabled: authReady && Boolean(orgId) && supportsFoodMenu,
  });

  if (!orgId || !supportsFoodMenu) return null;
  if (todayLoading || weeklyLoading) return <Skeleton className="h-72 w-full rounded-2xl" />;

  const todayHasItems = today?.meals.some((m) => m.items.trim().length > 0) ?? false;
  const weeklyHasItems = weekly.some((day) =>
    day.meals.some((m) => m.items.trim().length > 0),
  );
  if (!todayHasItems && !weeklyHasItems) return null;

  const todayDate = today
    ? new Date(today.date).toLocaleDateString(undefined, { dateStyle: "medium" })
    : null;

  return (
    <div id="menu" className="scroll-mt-20 space-y-6">
      {todayHasItems && today && (
        <section className="overflow-hidden rounded-2xl border-2 border-amber-200/90 bg-gradient-to-b from-amber-50 via-white to-orange-50/30 shadow-md dark:border-amber-900/60 dark:from-amber-950/50 dark:via-background dark:to-orange-950/20">
          <div className="border-b border-amber-200/80 bg-amber-100/50 px-4 py-5 text-center sm:px-6 dark:border-amber-900/50 dark:bg-amber-950/30">
            <div className="mx-auto flex max-w-md items-center justify-center gap-2">
              <UtensilsCrossed className="size-5 text-amber-700 dark:text-amber-400" />
              <h2 className="font-serif text-xl font-semibold tracking-wide text-amber-950 sm:text-2xl dark:text-amber-50">
                Today&apos;s Menu
              </h2>
            </div>
            <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">
              {today.dayLabel}
              {todayDate ? ` · ${todayDate}` : ""}
            </p>
          </div>
          <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {today.meals.map((meal) => (
              <div key={meal.mealType} className="px-4 py-4 text-center sm:px-5 sm:py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
                  {mealLabels[meal.mealType]}
                </p>
                <p className="mt-2 min-h-[3.5rem] whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {meal.items.trim() || "—"}
                </p>
                {meal.overridden && (
                  <span className="mt-2 inline-block rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
                    Chef&apos;s special
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {weeklyHasItems && (
        <section className="overflow-hidden rounded-2xl border-2 border-amber-200/70 bg-gradient-to-b from-white to-amber-50/40 shadow-sm dark:border-amber-900/50 dark:from-background dark:to-amber-950/20">
          <div className="border-b border-amber-200/60 bg-amber-50/80 px-4 py-4 sm:px-6 dark:border-amber-900/40 dark:bg-amber-950/25">
            <h2 className="font-serif text-lg font-semibold tracking-wide text-amber-950 sm:text-xl dark:text-amber-50">
              Weekly Menu
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              Standard menu for each day of the week
            </p>
          </div>

          {/* Mobile: stacked day cards */}
          <div className="divide-y md:hidden">
            {weekly.map((day) => {
              const hasDay = day.meals.some((m) => m.items.trim().length > 0);
              if (!hasDay) return null;
              return (
                <div key={day.dayOfWeek} className="px-4 py-4">
                  <p className="mb-3 font-semibold text-amber-900 dark:text-amber-100">{day.dayLabel}</p>
                  <div className="space-y-3">
                    {MEALS.map((meal) => {
                      const items = mealItems(day, meal);
                      if (!items) return null;
                      return (
                        <div key={meal} className="rounded-lg border bg-background/80 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            {mealLabels[meal]}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{items}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-amber-50/50 text-left dark:bg-amber-950/20">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Day</th>
                  {MEALS.map((meal) => (
                    <th key={meal} className="px-4 py-3 font-medium text-muted-foreground">
                      {mealLabels[meal]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekly.map((day) => (
                  <tr
                    key={day.dayOfWeek}
                    className={cn(
                      "border-b last:border-b-0",
                      day.dayLabel === today?.dayLabel && "bg-amber-50/60 dark:bg-amber-950/30",
                    )}
                  >
                    <td className="px-4 py-3 font-medium">{day.dayLabel}</td>
                    {MEALS.map((meal) => (
                      <td key={meal} className="px-4 py-3 align-top text-muted-foreground">
                        <span className="whitespace-pre-wrap leading-relaxed">
                          {mealItems(day, meal) || "—"}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
