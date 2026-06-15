"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { countByField, StatusFilterTabs } from "@/components/shared/status-filter-tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format/datetime";
import type { MembershipStatus, OrgMembership } from "@/types/api/membership";

const RESIDENT_FILTERS: Array<MembershipStatus | "ALL"> = [
  "ALL",
  "ACTIVE",
  "SUSPENDED",
  "LEFT",
];

const RESIDENT_FILTER_LABELS: Record<MembershipStatus | "ALL", string> = {
  ALL: "All",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  LEFT: "Left",
};

interface ResidentTableProps {
  residents: OrgMembership[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function ResidentTable({
  residents,
  isLoading,
  isError,
  onRetry,
}: ResidentTableProps) {
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | "ALL">("ALL");

  const allResidents = residents ?? [];

  const filteredResidents = useMemo(
    () =>
      statusFilter === "ALL"
        ? allResidents
        : allResidents.filter((r) => r.status === statusFilter),
    [allResidents, statusFilter],
  );

  const filterOptions = useMemo(
    () =>
      RESIDENT_FILTERS.map((value) => ({
        value,
        label: RESIDENT_FILTER_LABELS[value],
        count: countByField(allResidents, "status", value),
      })),
    [allResidents],
  );

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  if (isError) return <ErrorState onRetry={onRetry} />;

  if (!allResidents.length) {
    return (
      <EmptyState
        title="No residents yet"
        description="Approved join requests create active resident memberships."
      />
    );
  }

  return (
    <div className="space-y-4">
      <StatusFilterTabs
        value={statusFilter}
        onChange={setStatusFilter}
        options={filterOptions}
      />

      {filteredResidents.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No {statusFilter === "ALL" ? "" : RESIDENT_FILTER_LABELS[statusFilter].toLowerCase() + " "}
          residents in this view.
        </p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResidents.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{r.userFullName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.userEmail}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.userPhone ?? "—"}</td>
                      <td className="px-4 py-3">{r.roleName}</td>
                      <td className="px-4 py-3">
                        <Badge variant={r.status === "ACTIVE" ? "default" : "secondary"}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.joinedAt ? formatRelativeTime(r.joinedAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
