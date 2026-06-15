"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { countByField, StatusFilterTabs } from "@/components/shared/status-filter-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { leaveRequestsApi } from "@/lib/api/leave-requests";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { toast } from "sonner";

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

const LEAVE_FILTERS: Array<LeaveStatus | "ALL"> = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const LEAVE_FILTER_LABELS: Record<LeaveStatus | "ALL", string> = {
  ALL: "All",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

interface LeaveRequestsPanelProps {
  orgId: string;
}

export function LeaveRequestsPanel({ orgId }: LeaveRequestsPanelProps) {
  const { authReady } = useAuthReady();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "ALL">("ALL");

  const { data: requests = [] } = useQuery({
    queryKey: ["leave-requests", orgId],
    queryFn: () => leaveRequestsApi.list(orgId),
    enabled: authReady && Boolean(orgId),
  });

  const approve = useMutation({
    mutationFn: (id: string) => leaveRequestsApi.approve(orgId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leave-requests", orgId] });
      toast.success("Leave approved");
    },
  });

  const reject = useMutation({
    mutationFn: (id: string) => leaveRequestsApi.reject(orgId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leave-requests", orgId] });
      toast.success("Leave declined");
    },
  });

  const filterOptions = useMemo(
    () =>
      LEAVE_FILTERS.map((value) => ({
        value,
        label: LEAVE_FILTER_LABELS[value],
        count: countByField(requests, "status", value),
      })),
    [requests],
  );

  const filtered = useMemo(
    () =>
      statusFilter === "ALL"
        ? requests
        : requests.filter((r) => r.status === statusFilter),
    [requests, statusFilter],
  );

  if (requests.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Leave requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatusFilterTabs
          value={statusFilter}
          onChange={setStatusFilter}
          options={filterOptions}
        />

        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            No {statusFilter === "ALL" ? "" : LEAVE_FILTER_LABELS[statusFilter].toLowerCase() + " "}
            leave requests in this view.
          </p>
        ) : (
          filtered.map((req) => (
            <div
              key={req.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
            >
              <div>
                <p className="font-medium">{req.userFullName}</p>
                <p className="text-muted-foreground">{req.userEmail}</p>
                {req.reason && <p className="mt-1 text-xs">{req.reason}</p>}
              </div>
              {req.status === "PENDING" ? (
                <div className="flex gap-2">
                  <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate(req.id)}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reject.isPending}
                    onClick={() => reject.mutate(req.id)}
                  >
                    Decline
                  </Button>
                </div>
              ) : (
                <span className="text-xs font-medium uppercase text-muted-foreground">{req.status}</span>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
