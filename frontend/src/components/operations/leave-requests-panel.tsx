"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { leaveRequestsApi } from "@/lib/api/leave-requests";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { toast } from "sonner";

interface LeaveRequestsPanelProps {
  orgId: string;
}

export function LeaveRequestsPanel({ orgId }: LeaveRequestsPanelProps) {
  const { authReady } = useAuthReady();
  const queryClient = useQueryClient();
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

  const pending = requests.filter((r) => r.status === "PENDING");
  if (pending.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pending leave requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.map((req) => (
          <div key={req.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
            <div>
              <p className="font-medium">{req.userFullName}</p>
              <p className="text-muted-foreground">{req.userEmail}</p>
              {req.reason && <p className="mt-1 text-xs">{req.reason}</p>}
            </div>
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
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
