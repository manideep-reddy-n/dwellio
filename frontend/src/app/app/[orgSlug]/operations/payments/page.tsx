"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { PageTitle } from "@/components/shared/page-title";
import { PaymentManager } from "@/components/operations/payment-manager";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function OperationsPaymentsPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";

  return (
    <PageTransition>
      <PageTitle title="Payments" />
      <OpsGuard permission={PERMISSIONS.PAYMENT_MANAGE}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Rent & payments"
          description="Track monthly hostel rent. Residents are notified when payments are overdue."
        >
          {orgId && <PaymentManager orgId={orgId} />}
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
