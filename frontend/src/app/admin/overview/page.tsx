"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, HeartPulse, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { healthApi } from "@/lib/api/health";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAuth } from "@/hooks/use-auth";

export default function AdminOverviewPage() {
  const { user } = useAuth();

  const health = useQuery({
    queryKey: ["admin", "health"],
    queryFn: () => healthApi.check(),
  });

  const orgs = useQuery({
    queryKey: ["admin", "marketplace"],
    queryFn: () => marketplaceApi.search(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform overview</h1>
        <p className="mt-1 text-muted-foreground">
          Signed in as {user?.fullName} — platform administrator
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Marketplace orgs
            </CardTitle>
            <Building2 className="size-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            {orgs.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{orgs.data?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">API health</CardTitle>
            <HeartPulse className="size-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            {health.isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold capitalize">
                {health.data?.status ?? "unknown"}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admin APIs</CardTitle>
            <Users className="size-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              User/plan/moderation admin APIs are not in backend V1. This console uses marketplace
              and health endpoints.
            </p>
          </CardContent>
        </Card>
      </div>

      {health.isError && <ErrorState onRetry={() => void health.refetch()} />}
    </div>
  );
}
