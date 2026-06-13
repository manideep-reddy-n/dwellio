"use client";

import { Star } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format/datetime";
import type { Review } from "@/types/api/review";

interface ReviewModerationProps {
  reviews: Review[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function ReviewModeration({
  reviews,
  isLoading,
  isError,
  onRetry,
}: ReviewModerationProps) {
  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (isError) return <ErrorState onRetry={onRetry} />;

  if (!reviews?.length) {
    return (
      <EmptyState
        title="No reviews yet"
        description="Resident reviews appear here for moderation context."
      />
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm">{review.residentName}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(review.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="size-4 fill-current" />
              <span className="text-sm font-medium">{review.rating}</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
