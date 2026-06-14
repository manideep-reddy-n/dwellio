"use client";

import { useParams } from "next/navigation";
import { PageTransition } from "@/components/shared/page-transition";
import { PageTitle } from "@/components/shared/page-title";
import { FloorPlan } from "@/components/accommodation/floor-plan";
import { ResidentHomeHero } from "@/components/resident/resident-home-hero";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccommodationVisualization } from "@/hooks/use-accommodation";
import { useMyMembershipBySlug } from "@/hooks/use-memberships";
import { useMyOccupancy } from "@/hooks/use-occupancy";
import { usePermissions } from "@/hooks/use-permissions";

export default function ResidentAccommodationPage() {
  const { orgSlug = "" } = useParams<{ orgSlug: string }>();
  const { activeOrg } = usePermissions();
  const { data: membership, isLoading: membershipLoading } = useMyMembershipBySlug(orgSlug);
  const orgId = activeOrg?.id ?? membership?.organizationId;
  const orgName = activeOrg?.name ?? membership?.organizationName ?? "Your stay";

  const {
    data: viz,
    isLoading: vizLoading,
    isError,
    error,
  } = useAccommodationVisualization(orgId);
  const { data: occupancy } = useMyOccupancy(orgId);

  const isLoading = membershipLoading || (Boolean(orgId) && vizLoading);

  const highlightBedId = occupancy?.occupancyTarget === "BED" ? occupancy.bedId : undefined;
  const highlightSpaceId =
    occupancy?.occupancyTarget === "UNIT" ? occupancy.unitSpaceId : undefined;

  return (
    <PageTransition>
      <PageTitle title="Building layout" />
      <div className="space-y-6">
        <ResidentHomeHero orgName={orgName} orgSlug={orgSlug} />

        <div>
          <h2 className="text-xl font-semibold tracking-tight">Community blueprint</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bird&apos;s-eye view of blocks, floors, rooms, and bed sharing. Your allocation is highlighted.
          </p>
        </div>

        {isLoading && <Skeleton className="h-96 w-full rounded-xl" />}
        {!membershipLoading && !orgId && (
          <p className="text-sm text-muted-foreground">Loading your membership…</p>
        )}
        {isError && (
          <p className="text-sm text-destructive">
            Could not load building structure
            {error instanceof Error && error.message ? `: ${error.message}` : ""}. Restart the backend if you
            recently updated permissions.
          </p>
        )}
        {!isLoading && !isError && viz && (
          <FloorPlan
            visualization={viz}
            propertyName={orgName}
            highlightBedId={highlightBedId}
            highlightSpaceId={highlightSpaceId}
          />
        )}
        {!isLoading && !isError && viz && viz.buildings.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Your property has not published a building layout yet. Ask the owner to set up accommodation
            structure.
          </p>
        )}
      </div>
    </PageTransition>
  );
}
