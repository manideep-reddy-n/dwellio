"use client";

import { TrustScoreBadge } from "@/components/marketplace/trust-score-badge";
import { TrustScoreBreakdown } from "@/components/marketplace/trust-score-breakdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrustInputForOrg } from "@/hooks/use-marketplace-org";

interface OrgTrustPanelProps {
  orgSlug: string;
}

export function OrgTrustPanel({ orgSlug }: OrgTrustPanelProps) {
  const { trustInput, isLoading, isError } = useTrustInputForOrg(orgSlug);

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  if (isError || !trustInput) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        Trust score will appear once marketplace metrics are published for this property.
      </p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
      <div className="flex justify-center lg:justify-start">
        <TrustScoreBadge input={trustInput} size="lg" />
      </div>
      <TrustScoreBreakdown input={trustInput} />
    </div>
  );
}
