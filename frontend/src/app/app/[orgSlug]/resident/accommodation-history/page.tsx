"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { PageTitle } from "@/components/shared/page-title";
import { AccommodationHistoryView } from "@/components/operations/accommodation-history-view";
import { useMyAccommodationHistory } from "@/hooks/use-accommodation-history";
import { usePermissions } from "@/hooks/use-permissions";

export default function ResidentAccommodationHistoryPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const { data, isLoading } = useMyAccommodationHistory(orgId);

  return (
    <PageTransition>
      <PageTitle title="Stay history" />
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Your past and current bed or unit assignments.</p>
        <AccommodationHistoryView records={data} isLoading={isLoading} />
      </div>
    </PageTransition>
  );
}
