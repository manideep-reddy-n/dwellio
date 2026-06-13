"use client";

import Link from "next/link";
import { BedDouble, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyOccupancy } from "@/hooks/use-occupancy";
import { formatDate } from "@/lib/format/datetime";
import { useOrgStore } from "@/stores/org-store";

export function AccommodationSummaryCard() {
  const orgId = useOrgStore((s) => s.activeOrg?.id);
  const orgSlug = useOrgStore((s) => s.activeOrg?.slug);
  const { data: occupancy, isLoading, isError } = useMyOccupancy(orgId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My accommodation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Could not load your allocation. Try again shortly.
        </CardContent>
      </Card>
    );
  }

  if (!occupancy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My accommodation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You are not allocated to a bed or unit yet. Contact your property manager.
        </CardContent>
      </Card>
    );
  }

  const isBed = occupancy.occupancyTarget === "BED";
  const locationLabel = isBed
    ? occupancy.bedLabel ?? "Bed"
    : occupancy.unitIdentifier ?? "Unit";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">My accommodation</CardTitle>
        {isBed ? (
          <BedDouble className="size-4 text-muted-foreground" />
        ) : (
          <Building2 className="size-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-lg font-semibold">{locationLabel}</p>
        <p className="text-sm text-muted-foreground">
          {isBed ? "Bed allocation" : "Unit allocation"} · moved in {formatDate(occupancy.moveInDate)}
        </p>
        {orgSlug && (
          <Link
            href={`/app/${orgSlug}/resident`}
            className="text-xs text-primary hover:underline"
          >
            View resident home
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
