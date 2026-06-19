"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPagedTable } from "@/components/admin/admin-paged-table";
import { adminPlatformApi } from "@/lib/api/admin-platform";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [includeHidden, setIncludeHidden] = useState(false);

  const reviews = useQuery({
    queryKey: ["admin", "reviews", page, query, includeHidden],
    queryFn: () => adminPlatformApi.listReviews({ page, size: 20, query, includeHidden }),
  });

  const moderate = useMutation({
    mutationFn: ({ reviewId, action }: { reviewId: string; action: "hide" | "restore" }) =>
      action === "hide"
        ? adminPlatformApi.hideReview(reviewId)
        : adminPlatformApi.restoreReview(reviewId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast.success("Review updated");
    },
    onError: () => toast.error("Moderation failed"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="mt-1 text-muted-foreground">Moderation queue and hidden review management.</p>
      </div>

      <AdminPagedTable
        isLoading={reviews.isLoading}
        isError={reviews.isError}
        onRetry={() => void reviews.refetch()}
        columns={["Organization", "Author", "Rating", "Body", "Status", "Actions"]}
        page={page}
        totalPages={reviews.data?.totalPages ?? 1}
        onPageChange={setPage}
        searchValue={query}
        onSearchChange={(v) => {
          setQuery(v);
          setPage(0);
        }}
        filters={
          <div className="flex items-center gap-2">
            <input
              id="include-hidden"
              type="checkbox"
              className="size-4 accent-teal-600"
              checked={includeHidden}
              onChange={(e) => setIncludeHidden(e.target.checked)}
            />
            <Label htmlFor="include-hidden" className="text-xs">
              Include hidden
            </Label>
          </div>
        }
        rows={
          reviews.data?.content.map((r) => [
            r.organizationName,
            r.authorName,
            `${r.rating}/5`,
            <span key="body" className="line-clamp-2 max-w-xs">{r.body ?? "—"}</span>,
            <Badge key="status" variant={r.hidden ? "destructive" : "default"}>
              {r.hidden ? "Hidden" : "Visible"}
            </Badge>,
            r.hidden ? (
              <Button key="restore" size="sm" variant="outline" onClick={() => moderate.mutate({ reviewId: r.id, action: "restore" })}>
                Restore
              </Button>
            ) : (
              <Button key="hide" size="sm" variant="outline" onClick={() => moderate.mutate({ reviewId: r.id, action: "hide" })}>
                Hide
              </Button>
            ),
          ]) ?? []
        }
      />
    </div>
  );
}
