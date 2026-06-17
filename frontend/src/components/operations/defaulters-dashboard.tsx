"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useDefaulters } from "@/hooks/use-revenue";
import { formatDate } from "@/lib/format/datetime";
import { formatInr } from "@/lib/format/currency";

interface DefaultersDashboardProps {
  orgId: string;
  orgSlug: string;
}

export function DefaultersDashboard({ orgId, orgSlug }: DefaultersDashboardProps) {
  const { data = [], isLoading, isError, refetch } = useDefaulters(orgId);

  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title="No defaulters" description="All residents are up to date on payments." />;
  }

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <Card key={d.membershipId}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{d.residentName}</CardTitle>
            <p className="text-sm text-muted-foreground">{d.residentEmail}</p>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div>
              <span className="font-semibold text-rose-600">{formatInr(d.totalOutstanding)}</span>
              <span className="text-muted-foreground"> outstanding · {d.overduePaymentCount} overdue</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">Oldest due {formatDate(d.oldestDueDate)}</span>
              <Link
                href={`/app/${orgSlug}/operations/payments`}
                className="font-medium text-primary hover:underline"
              >
                View payments
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
