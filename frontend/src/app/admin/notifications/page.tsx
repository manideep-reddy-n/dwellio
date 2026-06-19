"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { AdminPagedTable } from "@/components/admin/admin-paged-table";
import { adminPlatformApi } from "@/lib/api/admin-platform";

export default function AdminNotificationsPage() {
  const [page, setPage] = useState(0);

  const metrics = useQuery({
    queryKey: ["admin", "notification-metrics"],
    queryFn: () => adminPlatformApi.notificationMetrics(),
  });

  const delivery = useQuery({
    queryKey: ["admin", "delivery-log", page],
    queryFn: () => adminPlatformApi.deliveryLog({ page, size: 20 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="mt-1 text-muted-foreground">Push delivery metrics, channel toggles, and failure monitoring.</p>
      </div>

      {metrics.isError && <ErrorState onRetry={() => void metrics.refetch()} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Push subscriptions</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{metrics.data?.activePushSubscriptions ?? 0}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Sent (24h)</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{metrics.data?.pushSentLast24Hours ?? 0}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Failed (24h)</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{metrics.data?.pushFailedLast24Hours ?? 0}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Global channels</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                Push: {metrics.data?.pushEnabledGlobally ? "on" : "off"} · In-app:{" "}
                {metrics.data?.inAppEnabledGlobally ? "on" : "off"}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Delivery log</h2>
        <AdminPagedTable
          isLoading={delivery.isLoading}
          isError={delivery.isError}
          onRetry={() => void delivery.refetch()}
          columns={["Channel", "Status", "User", "Error", "When"]}
          page={page}
          totalPages={delivery.data?.totalPages ?? 1}
          onPageChange={setPage}
          rows={
            delivery.data?.content.map((entry) => [
              entry.channel,
              entry.status,
              entry.userId.slice(0, 8) + "…",
              entry.errorMessage ?? "—",
              new Date(entry.createdAt).toLocaleString(),
            ]) ?? []
          }
        />
      </div>
    </div>
  );
}
