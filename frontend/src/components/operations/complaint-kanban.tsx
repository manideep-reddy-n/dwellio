"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ComplaintStatusBadge } from "@/components/resident/complaint-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useComplaintWorkflow } from "@/hooks/use-org-complaints";
import { usePermissions } from "@/hooks/use-permissions";
import { useStaffMembers } from "@/hooks/use-residents";
import { PERMISSIONS } from "@/lib/permissions/codes";
import {
  complaintCategoryLabels,
  complaintPriorityLabels,
} from "@/lib/resident/labels";
import { formatRelativeTime } from "@/lib/format/datetime";
import type { Complaint } from "@/types/api/complaint";
import type { ComplaintStatus } from "@/types/enums";

type KanbanColumn = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

const columns: { id: KanbanColumn; label: string; statuses: ComplaintStatus[] }[] = [
  { id: "OPEN", label: "Open", statuses: ["OPEN", "REOPENED"] },
  { id: "IN_PROGRESS", label: "In progress", statuses: ["IN_PROGRESS"] },
  { id: "RESOLVED", label: "Resolved", statuses: ["RESOLVED"] },
  { id: "CLOSED", label: "Closed", statuses: ["CLOSED"] },
];

interface ComplaintKanbanProps {
  orgId: string;
  complaints: Complaint[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function ComplaintKanban({
  orgId,
  complaints,
  isLoading,
  isError,
  onRetry,
}: ComplaintKanbanProps) {
  const { can, isOwner } = usePermissions();
  const { assign, start, resolve, close, reopen } = useComplaintWorkflow(orgId);
  const { data: staff } = useStaffMembers(orgId);
  const [assignTarget, setAssignTarget] = useState<Complaint | null>(null);
  const [assigneeId, setAssigneeId] = useState("");

  const grouped = useMemo(() => {
    const map: Record<KanbanColumn, Complaint[]> = {
      OPEN: [],
      IN_PROGRESS: [],
      RESOLVED: [],
      CLOSED: [],
    };
    for (const c of complaints ?? []) {
      const col = columns.find((col) => col.statuses.includes(c.status));
      if (col) map[col.id].push(c);
    }
    return map;
  }, [complaints]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((c) => (
          <Skeleton key={c.id} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={onRetry} />;

  if (!complaints?.length) {
    return (
      <EmptyState
        title="No complaints"
        description="Resident complaints will appear here in real time."
      />
    );
  }

  const canAssign = can(PERMISSIONS.COMPLAINT_ASSIGN) || isOwner;
  const canManage = can(PERMISSIONS.COMPLAINT_MANAGE) || isOwner;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">{column.label}</h3>
              <span className="text-xs text-muted-foreground">{grouped[column.id].length}</span>
            </div>
            <div className="flex min-h-[12rem] flex-col gap-2 rounded-xl border bg-muted/20 p-2">
              <AnimatePresence mode="popLayout">
                {grouped[column.id].map((complaint) => (
                  <motion.div
                    key={complaint.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="shadow-sm">
                      <CardHeader className="space-y-1 p-3 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm leading-snug">{complaint.title}</CardTitle>
                          <ComplaintStatusBadge status={complaint.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {complaintCategoryLabels[complaint.category]} ·{" "}
                          {complaintPriorityLabels[complaint.priority]} ·{" "}
                          {formatRelativeTime(complaint.updatedAt)}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-2 p-3 pt-0">
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {complaint.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {(complaint.status === "OPEN" || complaint.status === "REOPENED") && (
                            <>
                              {canAssign && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setAssignTarget(complaint);
                                    setAssigneeId("");
                                  }}
                                >
                                  Assign
                                </Button>
                              )}
                              {canManage && (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                  disabled={start.isPending}
                                  onClick={() => start.mutate(complaint.id)}
                                >
                                  Start
                                </Button>
                              )}
                            </>
                          )}
                          {complaint.status === "IN_PROGRESS" && canManage && (
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              disabled={resolve.isPending}
                              onClick={() => resolve.mutate(complaint.id)}
                            >
                              Resolve
                            </Button>
                          )}
                          {complaint.status === "RESOLVED" && canManage && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                                disabled={close.isPending}
                                onClick={() => close.mutate(complaint.id)}
                              >
                                Close
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                disabled={reopen.isPending}
                                onClick={() => reopen.mutate(complaint.id)}
                              >
                                Reopen
                              </Button>
                            </>
                          )}
                          {complaint.status === "CLOSED" && canManage && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={reopen.isPending}
                              onClick={() => reopen.mutate(complaint.id)}
                            >
                              Reopen
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(assignTarget)} onOpenChange={(open) => !open && setAssignTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="assignee">Staff member</Label>
            <select
              id="assignee"
              className="flex h-9 w-full rounded-lg border bg-background px-3 text-sm"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Select staff…</option>
              {staff?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.userFullName} ({m.roleName})
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={!assigneeId || assign.isPending}
              onClick={() => {
                if (!assignTarget || !assigneeId) return;
                assign.mutate(
                  { complaintId: assignTarget.id, assigneeMembershipId: assigneeId },
                  { onSuccess: () => setAssignTarget(null) },
                );
              }}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
