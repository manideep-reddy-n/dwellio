"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AdminPagedTable } from "@/components/admin/admin-paged-table";
import { buttonVariants } from "@/components/ui/button";
import { adminPlatformApi } from "@/lib/api/admin-platform";
import { cn } from "@/lib/utils";

export default function AdminResidentsPage() {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");

  const residents = useQuery({
    queryKey: ["admin", "residents", page, query],
    queryFn: () => adminPlatformApi.listResidents({ page, size: 20, query }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Residents</h1>
        <p className="mt-1 text-muted-foreground">Every active resident across the platform.</p>
      </div>

      <AdminPagedTable
        isLoading={residents.isLoading}
        isError={residents.isError}
        onRetry={() => void residents.refetch()}
        columns={["Name", "Email", "Organization", "Joined", ""]}
        page={page}
        totalPages={residents.data?.totalPages ?? 1}
        onPageChange={setPage}
        searchValue={query}
        onSearchChange={(v) => {
          setQuery(v);
          setPage(0);
        }}
        rows={
          residents.data?.content.map((r) => [
            <Link
              key="name"
              href={`/admin/users/${r.userId}`}
              className="font-medium text-teal-700 hover:underline"
            >
              {r.fullName}
            </Link>,
            <Link
              key="email"
              href={`/admin/users/${r.userId}`}
              className="text-muted-foreground hover:text-teal-700 hover:underline"
            >
              {r.email}
            </Link>,
            r.organizationName,
            new Date(r.joinedAt).toLocaleDateString(),
            <Link
              key="org"
              href={`/admin/organizations/${r.organizationId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Org
            </Link>,
          ]) ?? []
        }
      />
    </div>
  );
}
