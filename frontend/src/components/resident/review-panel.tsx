"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReview, useMyReview, useUpdateReview } from "@/hooks/use-reviews";
import { formatDate } from "@/lib/format/datetime";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReviewPanelProps {
  orgId: string;
}

export function ReviewPanel({ orgId }: ReviewPanelProps) {
  const { data: review, isLoading } = useMyReview(orgId);
  const createReview = useCreateReview(orgId);
  const updateReview = useUpdateReview(orgId);

  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  const isExisting = review != null;
  const displayRating = editing || !isExisting ? rating : review.rating;
  const displayBody = editing || !isExisting ? body : review.body;

  function startEdit() {
    if (!review) return;
    setRating(review.rating);
    setBody(review.body);
    setEditing(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      toast.error("Please add a short review");
      return;
    }

    try {
      if (isExisting && editing) {
        await updateReview.mutateAsync({ rating, body: body.trim() });
        toast.success("Review updated");
        setEditing(false);
      } else if (!isExisting) {
        await createReview.mutateAsync({ rating, body: body.trim() });
        toast.success("Review submitted");
        setBody("");
        setRating(5);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save review");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your review</CardTitle>
        <CardDescription>
          {isExisting
            ? `Submitted ${formatDate(review.createdAt)}`
            : "Share your experience after 7 days of membership."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isExisting && !editing ? (
          <div className="space-y-4">
            <StarRating value={review.rating} readonly />
            <p className="text-sm whitespace-pre-wrap">{review.body}</p>
            <Button variant="outline" size="sm" onClick={startEdit}>
              Edit review
            </Button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <StarRating value={displayRating} onChange={setRating} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-body">Your feedback</Label>
              <Textarea
                id="review-body"
                value={displayBody}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What went well? What could improve?"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              {editing && (
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={createReview.isPending || updateReview.isPending}
              >
                {isExisting ? "Save changes" : "Submit review"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function StarRating({
  value,
  onChange,
  readonly,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            "rounded p-0.5 transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:text-amber-500",
            star <= value ? "text-amber-500" : "text-muted-foreground/40",
          )}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
        >
          <Star className={cn("size-6", star <= value && "fill-current")} />
        </button>
      ))}
    </div>
  );
}
