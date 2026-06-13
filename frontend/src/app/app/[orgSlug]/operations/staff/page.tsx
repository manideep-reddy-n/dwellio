"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { StaffRolesManager } from "@/components/operations/staff-roles-manager";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function StaffPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";

  return (
    <PageTransition>
      <OpsGuard permission={PERMISSIONS.STAFF_MANAGE}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Staff & roles"
          description="Invite staff and manage role permissions."
        >
          {orgId && <StaffRolesManager orgId={orgId} />}
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
