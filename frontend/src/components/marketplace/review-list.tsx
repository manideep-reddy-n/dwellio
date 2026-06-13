import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicReview } from "@/types/api/marketplace";
import { cn } from "@/lib/utils";

interface ReviewListProps {
  reviews: PublicReview[];
  className?: string;
}

export function ReviewList({ reviews, className }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        No reviews yet. Be the first after joining and staying 7+ days.
      </p>
    );
  }

  return (
    <ul className={cn("space-y-3", className)}>
      {reviews.map((review) => (
        <li key={review.id}>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{review.residentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <StarRating rating={review.rating} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "size-4",
            index < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}
