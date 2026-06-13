"use client";

import { ReviewPanel } from "@/components/resident/review-panel";
import { PageTransition } from "@/components/shared/page-transition";
import { usePermissions } from "@/hooks/use-permissions";

export default function ResidentReviewPage() {
  const { activeOrg, can } = usePermissions();
  const orgId = activeOrg?.id;

  return (
    <PageTransition>
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your review</h1>
          <p className="mt-1 text-muted-foreground">
            Help future residents by sharing honest feedback.
          </p>
        </div>

        {orgId && (can("review:create") || can("review:update_own")) ? (
          <ReviewPanel orgId={orgId} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Review management is not available for your role.
          </p>
        )}
      </div>
    </PageTransition>
  );
}
