"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMyMealFeedback, useUpsertMealFeedback } from "@/hooks/use-meal-feedback";
import type { MealType } from "@/lib/api/food-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const mealLabels: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

interface MealFeedbackPanelProps {
  orgId: string;
  mealType: MealType;
  hasMenuItems: boolean;
}

export function MealFeedbackPanel({ orgId, mealType, hasMenuItems }: MealFeedbackPanelProps) {
  const { data: feedback = [] } = useMyMealFeedback(orgId);
  const upsert = useUpsertMealFeedback(orgId);
  const existing = feedback.find((item) => item.mealType === mealType);
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setRating(existing?.rating ?? null);
    setComment(existing?.comment ?? "");
  }, [existing?.rating, existing?.comment]);

  if (!hasMenuItems) return null;

  async function handleSubmit() {
    if (rating == null) {
      toast.error("Select a star rating");
      return;
    }
    try {
      await upsert.mutateAsync({
        mealType,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success(`${mealLabels[mealType]} rating saved`);
      setExpanded(false);
    } catch {
      toast.error("Could not save rating");
    }
  }

  return (
    <div className="mt-3 border-t border-amber-200/60 pt-3 dark:border-amber-900/40">
      <div className="flex flex-wrap items-center justify-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const value = index + 1;
          const active = (rating ?? existing?.rating ?? 0) >= value;
          return (
            <button
              key={value}
              type="button"
              aria-label={`Rate ${value} stars`}
              className="rounded p-0.5 transition-colors hover:bg-amber-100/80 dark:hover:bg-amber-950/40"
              onClick={() => {
                setRating(value);
                setExpanded(true);
              }}
            >
              <Star
                className={cn(
                  "size-5",
                  active ? "fill-amber-500 text-amber-500" : "text-amber-300 dark:text-amber-800",
                )}
              />
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-center text-[11px] text-muted-foreground">
        {existing ? `You rated ${existing.rating}★` : "Rate this meal"}
      </p>
      {expanded && (
        <div className="mt-3 space-y-2">
          <Textarea
            rows={2}
            placeholder="Optional comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="text-sm"
          />
          <div className="flex justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setExpanded(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={upsert.isPending} onClick={() => void handleSubmit()}>
              Save rating
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
