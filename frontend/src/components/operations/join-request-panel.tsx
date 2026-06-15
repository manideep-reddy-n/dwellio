"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { countByField, StatusFilterTabs } from "@/components/shared/status-filter-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useJoinRequestActions } from "@/hooks/use-join-requests";
import { formatRelativeTime } from "@/lib/format/datetime";
import type { JoinRequest, JoinRequestStatus } from "@/types/api/join-request";

const JOIN_FILTERS: Array<JoinRequestStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

const JOIN_FILTER_LABELS: Record<JoinRequestStatus | "ALL", string> = {
  ALL: "All",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

interface JoinRequestPanelProps {
  orgId: string;
  requests: JoinRequest[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  compact?: boolean;
  pendingOnly?: boolean;
}

export function JoinRequestPanel({
  orgId,
  requests,
  isLoading,
  isError,
  onRetry,
  compact,
  pendingOnly,
}: JoinRequestPanelProps) {
  const { approve, reject } = useJoinRequestActions(orgId);
  const [statusFilter, setStatusFilter] = useState<JoinRequestStatus | "ALL">("ALL");

  const allRequests = requests ?? [];

  const filteredByStatus = useMemo(() => {
    if (pendingOnly) {
      return allRequests.filter((r) => r.status === "PENDING");
    }
    if (statusFilter === "ALL") {
      return allRequests;
    }
    return allRequests.filter((r) => r.status === statusFilter);
  }, [allRequests, pendingOnly, statusFilter]);

  const filterOptions = useMemo(
    () =>
      JOIN_FILTERS.map((value) => ({
        value,
        label: JOIN_FILTER_LABELS[value],
        count: countByField(allRequests, "status", value),
      })),
    [allRequests],
  );

  const items = compact ? filteredByStatus.slice(0, 4) : filteredByStatus;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: compact ? 2 : 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={onRetry} />;

  if (!allRequests.length) {
    return (
      <EmptyState
        title="No join requests"
        description="New resident join requests will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {!compact && !pendingOnly && allRequests.length > 0 && (
        <StatusFilterTabs
          value={statusFilter}
          onChange={setStatusFilter}
          options={filterOptions}
        />
      )}

      {!items.length ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No {statusFilter === "ALL" ? "" : JOIN_FILTER_LABELS[statusFilter].toLowerCase() + " "}
          join requests in this view.
        </p>
      ) : (
        items.map((request, i) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <div>
                  <CardTitle className="text-sm">{request.userFullName}</CardTitle>
                  <p className="text-xs text-muted-foreground">{request.userEmail}</p>
                  {request.userPhone && (
                    <p className="text-xs text-muted-foreground">Phone: {request.userPhone}</p>
                  )}
                </div>
                <Badge
                  variant={
                    request.status === "PENDING"
                      ? "secondary"
                      : request.status === "APPROVED"
                        ? "default"
                        : "outline"
                  }
                >
                  {request.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {request.message && (
                  <p className="text-sm text-muted-foreground">{request.message}</p>
                )}
                {(request.emergencyContactName || request.emergencyContactPhone) && (
                  <p className="text-xs text-muted-foreground">
                    Emergency: {request.emergencyContactName}
                    {request.emergencyContactPhone ? ` · ${request.emergencyContactPhone}` : ""}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(request.createdAt)}
                </p>
                {request.status === "PENDING" && !compact && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-1"
                      disabled={approve.isPending}
                      onClick={() => approve.mutate(request.id)}
                    >
                      <Check className="size-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      disabled={reject.isPending}
                      onClick={() => reject.mutate({ id: request.id })}
                    >
                      <X className="size-3.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  );
}
