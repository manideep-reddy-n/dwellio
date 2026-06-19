"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminPagedTable } from "@/components/admin/admin-paged-table";
import { adminPlatformApi } from "@/lib/api/admin-platform";

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(0);

  const logs = useQuery({
    queryKey: ["admin", "audit-logs", page],
    queryFn: () => adminPlatformApi.listAuditLogs({ page, size: 20 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit logs</h1>
        <p className="mt-1 text-muted-foreground">Administrative actions across the platform.</p>
      </div>

      <AdminPagedTable
        isLoading={logs.isLoading}
        isError={logs.isError}
        onRetry={() => void logs.refetch()}
        columns={["Action", "Actor", "Entity", "Organization", "When"]}
        page={page}
        totalPages={logs.data?.totalPages ?? 1}
        onPageChange={setPage}
        rows={
          logs.data?.content.map((entry) => [
            entry.action.replace(/_/g, " "),
            entry.actorName,
            `${entry.entityType}${entry.entityId ? ` · ${entry.entityId.slice(0, 8)}…` : ""}`,
            entry.organizationName ?? "—",
            new Date(entry.createdAt).toLocaleString(),
          ]) ?? []
        }
      />
    </div>
  );
}
