"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider";
import type { MapMarker } from "@/components/maps/google-maps";

const ExploreMarkersMapInner = dynamic(
  () => import("@/components/maps/google-maps").then((m) => m.ExploreMarkersMap),
  { ssr: false, loading: () => <Skeleton className="h-[420px] w-full rounded-xl" /> },
);

const OrgLocationMapInner = dynamic(
  () => import("@/components/maps/google-maps").then((m) => m.OrgLocationMap),
  { ssr: false, loading: () => <Skeleton className="h-[240px] w-full rounded-xl" /> },
);

type ExploreProps = React.ComponentProps<typeof ExploreMarkersMapInner>;
type OrgLocationProps = React.ComponentProps<typeof OrgLocationMapInner>;

export function ExploreMarkersMap(props: ExploreProps) {
  return (
    <GoogleMapsProvider>
      <ExploreMarkersMapInner {...props} />
    </GoogleMapsProvider>
  );
}

export function OrgLocationMap(props: OrgLocationProps) {
  return (
    <GoogleMapsProvider>
      <OrgLocationMapInner {...props} />
    </GoogleMapsProvider>
  );
}

export type { MapMarker };
