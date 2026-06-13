"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { AssetManager } from "@/components/operations/asset-manager";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { useAssets } from "@/hooks/use-assets";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function AssetsPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data, isLoading, isError, refetch } = useAssets(orgId);

  return (
    <PageTransition>
      <OpsGuard permission={PERMISSIONS.BUILDING_MANAGE}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Assets"
          description="Track equipment, fixtures, and maintenance status."
        >
          {orgId && (
            <AssetManager
              orgId={orgId}
              assets={data}
              isLoading={isLoading}
              isError={isError}
              onRetry={() => void refetch()}
            />
          )}
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
