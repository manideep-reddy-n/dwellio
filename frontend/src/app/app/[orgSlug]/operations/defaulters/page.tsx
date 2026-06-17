"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { OperationsAutoBack } from "@/components/shared/page-back-header";
import { PageTitle } from "@/components/shared/page-title";
import { DefaultersDashboard } from "@/components/operations/defaulters-dashboard";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function DefaultersPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";

  return (
    <PageTransition>
      <PageTitle title="Defaulters" />
      <OperationsAutoBack orgSlug={orgSlug} />
      <OpsGuard permission={PERMISSIONS.PAYMENT_MANAGE}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Defaulters dashboard"
          description="Residents with overdue or partially paid charges."
        >
          {orgId && <DefaultersDashboard orgId={orgId} orgSlug={orgSlug} />}
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
