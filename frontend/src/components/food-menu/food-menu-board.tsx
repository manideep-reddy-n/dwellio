"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  foodMenuApi,
  type FoodMenuDay,
  type MealType,
  type TodayMenu,
} from "@/lib/api/food-menu";
import { queryKeys } from "@/lib/query/keys";
import { useAuthReady } from "@/hooks/use-auth-ready";

const MEALS: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];

const mealLabels: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

function mealItems(day: FoodMenuDay | TodayMenu | undefined, meal: MealType): string {
  return day?.meals.find((m) => m.mealType === meal)?.items?.trim() ?? "";
}

function isOverridden(day: FoodMenuDay | TodayMenu | undefined, meal: MealType): boolean {
  return day?.meals.find((m) => m.mealType === meal)?.overridden ?? false;
}

interface FoodMenuBoardProps {
  orgId: string;
}

export function FoodMenuBoard({ orgId }: FoodMenuBoardProps) {
  const { authReady } = useAuthReady();
  const queryClient = useQueryClient();
  const [editDay, setEditDay] = useState<FoodMenuDay | null>(null);
  const [editToday, setEditToday] = useState(false);
  const [draft, setDraft] = useState<Record<MealType, string>>({
    BREAKFAST: "",
    LUNCH: "",
    DINNER: "",
  });

  const { data: weekly = [], isLoading: weeklyLoading } = useQuery({
    queryKey: [...queryKeys.foodMenu(orgId), "weekly"],
    queryFn: () => foodMenuApi.weekly(orgId),
    enabled: authReady && Boolean(orgId),
  });

  const { data: today, isLoading: todayLoading } = useQuery({
    queryKey: [...queryKeys.foodMenu(orgId), "today"],
    queryFn: () => foodMenuApi.today(orgId),
    enabled: authReady && Boolean(orgId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.foodMenu(orgId) });
  };

  const saveWeeklyDay = useMutation({
    mutationFn: async (day: FoodMenuDay) => {
      await Promise.all(
        MEALS.map((meal) =>
          foodMenuApi.updateWeekly(orgId, {
            dayOfWeek: day.dayOfWeek,
            mealType: meal,
            items: draft[meal] ?? "",
          }),
        ),
      );
    },
    onSuccess: () => {
      invalidate();
      setEditDay(null);
      toast.success("Weekly menu updated");
    },
    onError: () => toast.error("Could not save weekly menu"),
  });

  const saveToday = useMutation({
    mutationFn: async () => {
      await Promise.all(
        MEALS.map((meal) =>
          foodMenuApi.updateToday(orgId, {
            mealType: meal,
            items: draft[meal] ?? "",
          }),
        ),
      );
    },
    onSuccess: () => {
      invalidate();
      setEditToday(false);
      toast.success("Today's menu updated — residents notified");
    },
    onError: () => toast.error("Could not update today's menu"),
  });

  const openWeeklyEdit = (day: FoodMenuDay) => {
    setDraft({
      BREAKFAST: mealItems(day, "BREAKFAST"),
      LUNCH: mealItems(day, "LUNCH"),
      DINNER: mealItems(day, "DINNER"),
    });
    setEditDay(day);
  };

  const openTodayEdit = () => {
    if (!today) return;
    setDraft({
      BREAKFAST: mealItems(today, "BREAKFAST"),
      LUNCH: mealItems(today, "LUNCH"),
      DINNER: mealItems(today, "DINNER"),
    });
    setEditToday(true);
  };

  const todayHasItems = useMemo(
    () => today?.meals.some((meal) => meal.items.trim().length > 0) ?? false,
    [today],
  );

  if (weeklyLoading || todayLoading) {
    return <Skeleton className="h-[520px] w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border-2 border-amber-200/80 bg-gradient-to-br from-amber-50 via-orange-50/40 to-white shadow-sm dark:border-amber-900/50 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-background">
        <div className="border-b border-amber-200/70 bg-amber-100/60 px-6 py-4 text-center dark:border-amber-900/40 dark:bg-amber-950/30">
          <div className="mx-auto flex max-w-lg items-center justify-center gap-2">
            <UtensilsCrossed className="size-5 text-amber-700 dark:text-amber-400" />
            <h2 className="font-serif text-2xl font-semibold tracking-wide text-amber-950 dark:text-amber-100">
              Today&apos;s Menu
            </h2>
          </div>
          {today && (
            <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">
              {today.dayLabel} · {new Date(today.date).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
          {MEALS.map((meal) => (
            <div key={meal} className="px-5 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
                {mealLabels[meal]}
              </p>
              <p className="mt-3 min-h-[4.5rem] whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {mealItems(today, meal) || "—"}
              </p>
              {isOverridden(today, meal) && (
                <span className="mt-2 inline-block rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 dark:bg-amber-900/50 dark:text-amber-100">
                  Special today
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center border-t border-amber-200/70 px-4 py-4 dark:border-amber-900/40">
          <Button variant="outline" className="gap-1.5" onClick={openTodayEdit}>
            <Pencil className="size-4" />
            Edit today&apos;s menu
          </Button>
        </div>
        {!todayHasItems && (
          <p className="border-t border-dashed border-amber-200/60 px-4 py-3 text-center text-xs text-muted-foreground dark:border-amber-900/30">
            No items set for today yet. Use the weekly menu below or edit today directly.
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b bg-muted/40 px-6 py-4">
          <h2 className="font-serif text-xl font-semibold tracking-wide">Weekly Menu</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your standard menu for each day. Residents always see today&apos;s effective menu at the top.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/20 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Day</th>
                {MEALS.map((meal) => (
                  <th key={meal} className="px-4 py-3 font-medium text-muted-foreground">
                    {mealLabels[meal]}
                  </th>
                ))}
                <th className="w-14 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {weekly.map((day) => (
                <tr key={day.dayOfWeek} className="border-b last:border-b-0 hover:bg-muted/10">
                  <td className="px-4 py-4 font-medium">{day.dayLabel}</td>
                  {MEALS.map((meal) => (
                    <td key={meal} className="px-4 py-4 align-top text-muted-foreground">
                      <span className="line-clamp-4 whitespace-pre-wrap">
                        {mealItems(day, meal) || "—"}
                      </span>
                    </td>
                  ))}
                  <td className="px-2 py-4 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${day.dayLabel} menu`}
                      onClick={() => openWeeklyEdit(day)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={editDay !== null} onOpenChange={(open) => !open && setEditDay(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {editDay?.dayLabel} menu</DialogTitle>
            <DialogDescription>
              Set the weekly template for breakfast, lunch, and dinner.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {MEALS.map((meal) => (
              <div key={meal} className="space-y-2">
                <Label htmlFor={`weekly-${meal}`}>{mealLabels[meal]}</Label>
                <Textarea
                  id={`weekly-${meal}`}
                  rows={3}
                  value={draft[meal]}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, [meal]: event.target.value }))
                  }
                  placeholder={`Items for ${mealLabels[meal].toLowerCase()}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDay(null)}>
              Cancel
            </Button>
            <Button
              disabled={!editDay || saveWeeklyDay.isPending}
              onClick={() => editDay && saveWeeklyDay.mutate(editDay)}
            >
              Save day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editToday} onOpenChange={setEditToday}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit today&apos;s menu</DialogTitle>
            <DialogDescription>
              Overrides apply only for today. The weekly template stays unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {MEALS.map((meal) => (
              <div key={meal} className="space-y-2">
                <Label htmlFor={`today-${meal}`}>{mealLabels[meal]}</Label>
                <Textarea
                  id={`today-${meal}`}
                  rows={3}
                  value={draft[meal]}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, [meal]: event.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditToday(false)}>
              Cancel
            </Button>
            <Button disabled={saveToday.isPending} onClick={() => saveToday.mutate()}>
              Update today
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
