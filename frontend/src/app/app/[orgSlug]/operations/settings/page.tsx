"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { OrgSettingsForm } from "@/components/operations/org-settings-form";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function SettingsPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";

  return (
    <PageTransition>
      <OpsGuard permission={PERMISSIONS.ORGANIZATION_UPDATE}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Organization settings"
          description="Update your organization profile and contact details."
        >
          {orgId && <OrgSettingsForm orgId={orgId} />}
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
