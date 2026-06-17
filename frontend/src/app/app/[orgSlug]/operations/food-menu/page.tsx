"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { FoodMenuBoard } from "@/components/food-menu/food-menu-board";
import { MealAnalyticsPanel } from "@/components/food-menu/meal-analytics-panel";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { useOrganization } from "@/hooks/use-organization";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";
import { supportsFoodMenu } from "@/lib/food-menu/org-support";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FoodMenuPage() {
  const router = useRouter();
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data: org } = useOrganization(orgId);
  const isFoodOrg = supportsFoodMenu(org?.type);

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
          description="Plan your weekly menu, set today's specials, and review resident meal feedback."
        >
          {orgId && isFoodOrg && (
            <div className="space-y-8">
              <section className="space-y-3">
                <h2 className="text-base font-semibold">Meal feedback analytics</h2>
                <MealAnalyticsPanel orgId={orgId} />
              </section>
              <FoodMenuBoard orgId={orgId} />
            </div>
          )}
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
