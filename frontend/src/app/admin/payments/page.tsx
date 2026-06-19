"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { AdminPagedTable } from "@/components/admin/admin-paged-table";
import { adminPlatformApi } from "@/lib/api/admin-platform";

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");

  const payments = useQuery({
    queryKey: ["admin", "payments", page, query],
    queryFn: () => adminPlatformApi.listPayments({ page, size: 20, query }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="mt-1 text-muted-foreground">Platform-wide payment records and outstanding balances.</p>
      </div>

      <AdminPagedTable
        isLoading={payments.isLoading}
        isError={payments.isError}
        onRetry={() => void payments.refetch()}
        columns={["Resident", "Organization", "Month", "Amount", "Paid", "Status", "Due"]}
        page={page}
        totalPages={payments.data?.totalPages ?? 1}
        onPageChange={setPage}
        searchValue={query}
        onSearchChange={(v) => {
          setQuery(v);
          setPage(0);
        }}
        rows={
          payments.data?.content.map((p) => [
            p.residentName,
            p.organizationName,
            p.billingMonth,
            `₹${p.amount.toLocaleString()}`,
            `₹${p.amountPaid.toLocaleString()}`,
            <Badge key="status" variant="secondary">{p.status}</Badge>,
            new Date(p.dueDate).toLocaleDateString(),
          ]) ?? []
        }
      />
    </div>
  );
}
