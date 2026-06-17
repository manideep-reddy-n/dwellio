"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { PageTitle } from "@/components/shared/page-title";
import { BillingRulesPanel } from "@/components/operations/billing-rules-panel";
import { PaymentManager } from "@/components/operations/payment-manager";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { useOrganization } from "@/hooks/use-organization";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function OperationsPaymentsPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data: org } = useOrganization(orgId);
  const isGated = org?.type === "GATED_COMMUNITY";

  return (
    <PageTransition>
      <PageTitle title="Payments" />
      <OpsGuard permission={PERMISSIONS.PAYMENT_MANAGE}>
        <OperationsShell
          orgSlug={orgSlug}
          title={isGated ? "Maintenance & payments" : "Rent & payments"}
          description={
            isGated
              ? "Configure maintenance billing rules and track unit charges."
              : "Track monthly rent. Residents are notified when payments are overdue."
          }
        >
          {orgId && (
            <div className="space-y-6">
              <BillingRulesPanel orgId={orgId} />
              <PaymentManager orgId={orgId} />
            </div>
          )}
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
