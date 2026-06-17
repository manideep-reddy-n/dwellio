"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { OperationsAutoBack } from "@/components/shared/page-back-header";
import { PageTitle } from "@/components/shared/page-title";
import { LedgerView } from "@/components/operations/ledger-view";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { useLedger } from "@/hooks/use-ledger";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function OpsLedgerPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data, isLoading } = useLedger(orgId);

  return (
    <PageTransition>
      <PageTitle title="Ledger" />
      <OperationsAutoBack orgSlug={orgSlug} />
      <OpsGuard permission={PERMISSIONS.PAYMENT_MANAGE}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Financial ledger"
          description="Append-only running balance per resident."
        >
          <LedgerView entries={data} isLoading={isLoading} showResident />
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
