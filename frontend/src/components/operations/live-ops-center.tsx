"use client";

import Link from "next/link";
import { Activity, Bell, Megaphone, UserPlus, Wrench } from "lucide-react";
import { ComplaintList } from "@/components/resident/complaint-list";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { JoinRequestPanel } from "@/components/operations/join-request-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveOps } from "@/hooks/use-live-ops";
import { useWebSocketStore } from "@/stores/websocket-store";
import { formatRelativeTime } from "@/lib/format/datetime";
import { MetricsDashboard } from "@/components/operations/metrics-dashboard";

interface LiveOpsCenterProps {
  orgId: string;
  orgSlug: string;
}

export function LiveOpsCenter({ orgId, orgSlug }: LiveOpsCenterProps) {
  const wsStatus = useWebSocketStore((s) => s.status);
  const { data, isLoading, isError, refetch } = useLiveOps(orgId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant={wsStatus === "connected" ? "default" : "secondary"}>
          {wsStatus === "connected" ? "Live" : "Connecting…"}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Updates stream via WebSocket — no refresh needed
        </span>
      </div>

      <MetricsDashboard
        metrics={data?.metrics}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
      />

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <Wrench className="mb-2 size-5 text-teal-600" />
                <CardTitle className="text-base">Recent complaints</CardTitle>
                <CardDescription>Latest filings and status changes</CardDescription>
              </div>
              <Link
                href={`/app/${orgSlug}/operations/complaints`}
                className="text-xs font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <ComplaintList complaints={data?.complaints} orgSlug={orgSlug} compact />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <Megaphone className="mb-2 size-5 text-teal-600" />
                <CardTitle className="text-base">Announcements</CardTitle>
                <CardDescription>Recently published</CardDescription>
              </div>
              <Link
                href={`/app/${orgSlug}/operations/announcements`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Manage
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.announcements?.length ? (
                data.announcements.map((a) => (
                  <div key={a.id} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(a.publishedAt ?? a.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState title="No published announcements" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <UserPlus className="mb-2 size-5 text-teal-600" />
                <CardTitle className="text-base">Pending joins</CardTitle>
                <CardDescription>Awaiting approval</CardDescription>
              </div>
              <Link
                href={`/app/${orgSlug}/operations/join-requests`}
                className="text-xs font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <JoinRequestPanel
                orgId={orgId}
                requests={data?.joinRequests}
                compact
                pendingOnly
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <Activity className="mb-2 size-5 text-teal-600" />
                <CardTitle className="text-base">Occupancy</CardTitle>
                <CardDescription>Current allocations</CardDescription>
              </div>
              <Link
                href={`/app/${orgSlug}/operations/accommodation`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Open map
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {data?.occupancies?.length ? (
                data.occupancies.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span className="font-medium">{o.residentName}</span>
                    <span className="text-muted-foreground">
                      {o.bedLabel ?? o.unitIdentifier ?? "—"}
                    </span>
                  </div>
                ))
              ) : (
                <EmptyState title="No active occupancies" />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <Bell className="mb-2 size-5 text-teal-600" />
          <CardTitle className="text-base">Activity feed</CardTitle>
          <CardDescription>Cross-domain operational events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data?.complaints?.slice(0, 3).map((c) => (
            <div key={c.id} className="flex justify-between border-b py-2 last:border-0">
              <span>
                Complaint <strong>{c.title}</strong> — {c.status}
              </span>
              <span className="text-muted-foreground">{formatRelativeTime(c.updatedAt)}</span>
            </div>
          ))}
          {data?.joinRequests?.map((j) => (
            <div key={j.id} className="flex justify-between border-b py-2 last:border-0">
              <span>
                Join request from <strong>{j.userFullName}</strong>
              </span>
              <span className="text-muted-foreground">{formatRelativeTime(j.createdAt)}</span>
            </div>
          ))}
          {!data?.complaints?.length && !data?.joinRequests?.length && (
            <p className="text-muted-foreground">Activity will appear as events occur.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
