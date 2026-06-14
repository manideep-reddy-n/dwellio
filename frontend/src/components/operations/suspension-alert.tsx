"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { suspensionAppealApi } from "@/lib/api/suspension-appeals";
import type { OrganizationStatus } from "@/types/enums";

interface SuspensionAlertProps {
  orgId: string;
  status: OrganizationStatus | undefined;
}

export function SuspensionAlert({ orgId, status }: SuspensionAlertProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: pending } = useQuery({
    queryKey: ["suspension-appeal", orgId, "pending"],
    queryFn: () => suspensionAppealApi.getPending(orgId),
    enabled: status === "SUSPENDED" && Boolean(orgId),
  });

  const submit = useMutation({
    mutationFn: () => suspensionAppealApi.submit(orgId, reason),
    onSuccess: () => {
      toast.success("Appeal submitted for admin review");
      setReason("");
      setShowForm(false);
      void queryClient.invalidateQueries({ queryKey: ["suspension-appeal", orgId] });
    },
    onError: () => toast.error("Could not submit appeal"),
  });

  if (status !== "SUSPENDED") return null;

  return (
    <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-5 shadow-sm dark:border-rose-900 dark:bg-rose-950/40">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-6 shrink-0 text-rose-600" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-rose-900 dark:text-rose-100">
            Organization suspended
          </h2>
          <p className="mt-1 text-sm text-rose-800/90 dark:text-rose-200/90">
            Your organization is hidden from Explore and public profiles. Operations continue, but
            residents cannot discover you on the marketplace until suspension is lifted.
          </p>
          {pending ? (
            <p className="mt-3 text-sm font-medium text-rose-700 dark:text-rose-300">
              Appeal pending admin review (submitted{" "}
              {new Date(pending.createdAt).toLocaleDateString()}).
            </p>
          ) : showForm ? (
            <div className="mt-4 space-y-2">
              <Textarea
                rows={4}
                placeholder="Explain why the suspension should be reviewed or lifted…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={!reason.trim() || submit.isPending}
                  onClick={() => submit.mutate()}
                >
                  Submit appeal
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="mt-4 border-rose-400 text-rose-800 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-200"
              onClick={() => setShowForm(true)}
            >
              Submit appeal to platform admin
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
