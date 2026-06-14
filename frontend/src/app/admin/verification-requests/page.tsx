"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { adminVerificationApi } from "@/lib/api/admin-verification";
import type { VerificationRequestStatus } from "@/lib/api/verification";

const statusOptions: { value: VerificationRequestStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "MORE_INFO_REQUIRED", label: "More info required" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function AdminVerificationRequestsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <AdminVerificationRequestsContent />
    </Suspense>
  );
}

function AdminVerificationRequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const statusFilter = (searchParams.get("status") as VerificationRequestStatus | null) ?? undefined;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "verification-requests", statusFilter, search],
    queryFn: () =>
      adminVerificationApi.list({
        status: statusFilter,
        q: search || undefined,
      }),
  });

  function applyFilters(nextStatus?: VerificationRequestStatus | "ALL") {
    const params = new URLSearchParams();
    if (nextStatus && nextStatus !== "ALL") params.set("status", nextStatus);
    if (search) params.set("q", search);
    router.push(`/admin/verification-requests?${params.toString()}`);
  }

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verification requests</h1>
        <p className="text-muted-foreground">
          Review organization verification submissions and documents.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by organization name or slug"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") applyFilters(statusFilter ?? "ALL");
          }}
          className="max-w-md"
        />
        <Button variant="secondary" onClick={() => applyFilters(statusFilter ?? "ALL")}>
          Search
        </Button>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={
                (option.value === "ALL" && !statusFilter) || option.value === statusFilter
                  ? "default"
                  : "outline"
              }
              onClick={() => applyFilters(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {!data?.length ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No verification requests match your filters.
        </p>
      ) : (
        <div className="grid gap-4">
          {data.map((request) => (
            <Card key={request.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">{request.organizationName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{request.organizationSlug}</p>
                </div>
                <Badge>{request.status}</Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="space-y-1 text-muted-foreground">
                  <p>Type: {request.organizationType}</p>
                  <p>Documents: {request.documentCount}</p>
                  {request.submittedAt && (
                    <p>Submitted: {new Date(request.submittedAt).toLocaleString()}</p>
                  )}
                </div>
                <Link
                  href={`/admin/verification-requests/${request.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                >
                  Review
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
