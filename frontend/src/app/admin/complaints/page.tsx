"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { AdminPagedTable } from "@/components/admin/admin-paged-table";
import { adminPlatformApi } from "@/lib/api/admin-platform";
import type { ComplaintStatus } from "@/types/enums";

export default function AdminComplaintsPage() {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ComplaintStatus | "ALL">("ALL");

  const complaints = useQuery({
    queryKey: ["admin", "complaints", page, query, status],
    queryFn: () =>
      adminPlatformApi.listComplaints({
        page,
        size: 20,
        query,
        status: status === "ALL" ? undefined : status,
      }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Complaints</h1>
        <p className="mt-1 text-muted-foreground">Platform-wide complaint visibility and SLA overview.</p>
      </div>

      <AdminPagedTable
        isLoading={complaints.isLoading}
        isError={complaints.isError}
        onRetry={() => void complaints.refetch()}
        columns={["Title", "Organization", "Status", "Priority", "Created"]}
        page={page}
        totalPages={complaints.data?.totalPages ?? 1}
        onPageChange={setPage}
        searchValue={query}
        onSearchChange={(v) => {
          setQuery(v);
          setPage(0);
        }}
        filters={
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ComplaintStatus | "ALL");
              setPage(0);
            }}
          >
            <option value="ALL">All statuses</option>
            {(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"] as ComplaintStatus[]).map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        }
        rows={
          complaints.data?.content.map((c) => [
            <span key="title" className="font-medium">{c.title}</span>,
            c.organizationName,
            <Badge key="status" variant="secondary">{c.status.replace(/_/g, " ")}</Badge>,
            c.priority,
            new Date(c.createdAt).toLocaleDateString(),
          ]) ?? []
        }
      />
    </div>
  );
}
