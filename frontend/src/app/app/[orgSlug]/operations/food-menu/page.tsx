"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { FoodMenuBoard } from "@/components/food-menu/food-menu-board";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { useOrganization } from "@/hooks/use-organization";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FoodMenuPage() {
  const router = useRouter();
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data: org } = useOrganization(orgId);
  const isFoodOrg = org?.type === "HOSTEL" || org?.type === "PG";

  useEffect(() => {
    if (org && !isFoodOrg) {
      router.replace(`/app/${orgSlug}/operations`);
    }
  }, [org, isFoodOrg, orgSlug, router]);

  return (
    <PageTransition>
      <OpsGuard permission={PERMISSIONS.ORGANIZATION_UPDATE}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Food menu"
          description="Plan your weekly menu and set today's specials for residents."
        >
          {orgId && isFoodOrg && <FoodMenuBoard orgId={orgId} />}
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
