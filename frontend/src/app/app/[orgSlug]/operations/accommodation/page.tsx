"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { AccommodationManager } from "@/components/accommodation/accommodation-manager";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function AccommodationPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";

  return (
    <PageTransition>
      <OpsGuard permission={PERMISSIONS.BUILDING_MANAGE}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Accommodation"
          description="2D floor plan, structure management, allocation, and live occupancy."
        >
          {orgId && <AccommodationManager orgId={orgId} />}
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
