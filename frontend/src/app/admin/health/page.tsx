"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { healthApi } from "@/lib/api/health";
import { Badge } from "@/components/ui/badge";

export default function AdminHealthPage() {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["admin", "health"],
    queryFn: () => healthApi.check(),
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System health</h1>
        <p className="mt-1 text-muted-foreground">
          Live API health check — refreshes every 30 seconds.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Backend API</CardTitle>
          {data && (
            <Badge variant={data.status === "UP" ? "default" : "destructive"}>
              {data.status}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {isLoading && <Skeleton className="h-8 w-32" />}
          {isError && <ErrorState onRetry={() => void refetch()} />}
          {data && (
            <p className="text-sm text-muted-foreground">
              Last checked {new Date(dataUpdatedAt).toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
