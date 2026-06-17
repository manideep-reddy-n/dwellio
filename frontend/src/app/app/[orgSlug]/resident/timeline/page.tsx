"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { PageTitle } from "@/components/shared/page-title";
import { ErrorState } from "@/components/shared/error-state";
import { VerticalTimeline } from "@/components/shared/vertical-timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyTimeline } from "@/hooks/use-timeline";
import { usePermissions } from "@/hooks/use-permissions";

export default function ResidentTimelinePage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const { data = [], isLoading, isError, refetch } = useMyTimeline(orgId);

  return (
    <PageTransition>
      <PageTitle title="My timeline" />
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Your stay activity — billing, accommodation, and more.
        </p>
        {isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : isLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <VerticalTimeline events={data} />
        )}
      </div>
    </PageTransition>
  );
}
