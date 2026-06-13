"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format/datetime";
import type { OrgMembership } from "@/types/api/membership";

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
  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  if (isError) return <ErrorState onRetry={onRetry} />;

  if (!residents?.length) {
    return (
      <EmptyState
        title="No residents yet"
        description="Approved join requests create active resident memberships."
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {residents.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{r.userFullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.userEmail}</td>
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
  );
}
