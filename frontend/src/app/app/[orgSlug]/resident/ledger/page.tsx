"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { PageTitle } from "@/components/shared/page-title";
import { LedgerView } from "@/components/operations/ledger-view";
import { useMyLedger } from "@/hooks/use-ledger";
import { usePermissions } from "@/hooks/use-permissions";

export default function ResidentLedgerPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const { data, isLoading } = useMyLedger(orgId);

  return (
    <PageTransition>
      <PageTitle title="My ledger" />
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Your running balance and transaction history.</p>
        <LedgerView entries={data} isLoading={isLoading} />
      </div>
    </PageTransition>
  );
}
