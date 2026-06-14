"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { adminApi } from "@/lib/api/admin";

export default function AdminOrganizationsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "organizations"],
    queryFn: () => adminApi.listOrganizations(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
        <p className="mt-1 text-muted-foreground">
          All organizations including pending verification. Open admin detail — not owner operations.
        </p>
      </div>

      {isLoading && <Skeleton className="h-48 w-full rounded-xl" />}
      {isError && <ErrorState onRetry={() => void refetch()} />}

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.map((org) => (
          <Card key={org.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-base">{org.name}</CardTitle>
              <Badge variant={org.status === "VERIFIED" ? "default" : "secondary"}>{org.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
              <p>
                {org.city}
                {org.area ? ` · ${org.area}` : ""} · {org.type.replace(/_/g, " ")}
              </p>
              <p>{org.activeResidentCount} residents · {org.slug}</p>
              <Link href={`/admin/organizations/${org.id}`}>
                <Button size="sm" variant="outline">
                  Admin detail
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
