"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { OperationsAutoBack } from "@/components/shared/page-back-header";
import { PageTitle } from "@/components/shared/page-title";
import { AccommodationHistoryView } from "@/components/operations/accommodation-history-view";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { useAccommodationHistory } from "@/hooks/use-accommodation-history";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function OpsAccommodationHistoryPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data, isLoading } = useAccommodationHistory(orgId);

  return (
    <PageTransition>
      <PageTitle title="Accommodation history" />
      <OperationsAutoBack orgSlug={orgSlug} />
      <OpsGuard permission={PERMISSIONS.RESIDENT_MANAGE}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Accommodation history"
          description="Bed, room, and unit stay records for all residents."
        >
          <AccommodationHistoryView records={data} isLoading={isLoading} showResident />
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
