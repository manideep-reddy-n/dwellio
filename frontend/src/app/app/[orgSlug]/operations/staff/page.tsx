"use client";

import { PropertyTeamCard } from "@/components/resident/property-team-card";
import { PageTransition } from "@/components/shared/page-transition";
import { MyRoleCard } from "@/components/shared/my-role-card";
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
          <div className="space-y-6">
            <MyRoleCard />
            {orgId && <PropertyTeamCard orgId={orgId} title="Team contacts" />}
            {orgId && <StaffRolesManager orgId={orgId} />}
          </div>
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
