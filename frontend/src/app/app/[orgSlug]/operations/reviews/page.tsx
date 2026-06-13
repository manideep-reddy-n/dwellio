"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { ReviewModeration } from "@/components/operations/review-moderation";
import { useOrgReviews } from "@/hooks/use-ops-reviews";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function ReviewsPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data, isLoading, isError, refetch } = useOrgReviews(orgId);

  return (
    <PageTransition>
      <OpsGuard permission={PERMISSIONS.DASHBOARD_VIEW}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Review moderation"
          description="Monitor resident feedback and reported reviews."
        >
          <ReviewModeration
            reviews={data}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
          />
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
