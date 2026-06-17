"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/format/datetime";
import { formatInr } from "@/lib/format/currency";
import type { LedgerEntry } from "@/lib/api/ledger";

interface LedgerViewProps {
  entries: LedgerEntry[] | undefined;
  isLoading?: boolean;
  showResident?: boolean;
}

const entryLabels: Record<LedgerEntry["entryType"], string> = {
  CHARGE_GENERATED: "Charge",
  PAYMENT_RECEIVED: "Payment",
  REFUND: "Refund",
  PENALTY_APPLIED: "Penalty",
  ADJUSTMENT: "Adjustment",
};

export function LedgerView({ entries, isLoading, showResident }: LedgerViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!entries?.length) {
    return <EmptyState title="No ledger entries" description="Transactions will appear here as charges and payments are recorded." />;
  }

  const runningBalance = entries[0]?.balanceAfter;

  return (
    <div className="space-y-4">
      {runningBalance != null && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <span className="text-sm text-muted-foreground">Current balance</span>
            <span className="text-xl font-bold">{formatInr(runningBalance)}</span>
          </CardContent>
        </Card>
      )}
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
          >
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{entryLabels[entry.entryType]}</Badge>
                {showResident && <span className="font-medium">{entry.residentName}</span>}
              </div>
              <p className="mt-1 text-muted-foreground">
                {entry.description ?? "—"}
                {entry.referenceMonth && ` · ${entry.referenceMonth.slice(0, 7)}`}
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                {entry.entryType === "PAYMENT_RECEIVED" ? "−" : "+"}
                {formatInr(entry.amount)}
              </p>
              <p className="text-xs text-muted-foreground">Bal {formatInr(entry.balanceAfter)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
