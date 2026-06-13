"use client";

import { ComplaintCreateDialog } from "@/components/resident/complaint-create-dialog";
import { ComplaintList } from "@/components/resident/complaint-list";
import { PageTransition } from "@/components/shared/page-transition";
import { useMyComplaints } from "@/hooks/use-complaints";
import { usePermissions } from "@/hooks/use-permissions";

export default function ResidentComplaintsPage() {
  const { activeOrg, can } = usePermissions();
  const orgId = activeOrg?.id;

  const { data: complaints, isLoading } = useMyComplaints(orgId);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My complaints</h1>
            <p className="mt-1 text-muted-foreground">
              Track issues and see status updates as staff work on them.
            </p>
          </div>
          {can("complaint:create") && orgId && (
            <ComplaintCreateDialog orgId={orgId} />
          )}
        </div>

        {can("complaint:read_own") ? (
          <ComplaintList
            complaints={complaints}
            isLoading={isLoading}
            emptyMessage="You have not submitted any complaints yet."
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            You do not have permission to view complaints.
          </p>
        )}
      </div>
    </PageTransition>
  );
}
