"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { marketplaceApi } from "@/lib/api/marketplace";
import { TrustScoreBadge } from "@/components/marketplace/trust-score-badge";

export default function AdminOrganizationsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "marketplace"],
    queryFn: () => marketplaceApi.search(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
        <p className="mt-1 text-muted-foreground">
          All marketplace-visible organizations (public API).
        </p>
      </div>

      {isLoading && <Skeleton className="h-48 w-full rounded-xl" />}
      {isError && <ErrorState onRetry={() => void refetch()} />}

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.map((org) => (
          <Card key={org.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-base">{org.name}</CardTitle>
              {org.metrics && (
                <TrustScoreBadge
                  size="sm"
                  showLabel={false}
                  input={{
                    avgRating: org.metrics.avgRating,
                    reviewCount: org.metrics.reviewCount,
                    resolutionRate: org.metrics.resolutionRate,
                    avgFirstResponseHours: org.metrics.avgFirstResponseHours,
                    verificationStatus: "VERIFIED",
                  }}
                />
              )}
            </CardHeader>
            <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
              <p>
                {org.city} · {org.type.replace(/_/g, " ")}
              </p>
              <div className="flex gap-3">
                <Link href={`/${org.slug}`} className="text-primary hover:underline">
                  Marketplace
                </Link>
                <Link href={`/app/${org.slug}/operations`} className="text-primary hover:underline">
                  Operations
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
