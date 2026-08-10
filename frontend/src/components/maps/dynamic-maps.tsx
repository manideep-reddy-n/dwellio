"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapMarker } from "@/components/maps/osm-maps";

export const ExploreMarkersMap = dynamic(
  () => import("@/components/maps/osm-maps").then((m) => m.ExploreMarkersMap),
  { ssr: false, loading: () => <Skeleton className="h-[420px] w-full rounded-xl" /> },
);

export const OrgLocationMap = dynamic(
  () => import("@/components/maps/osm-maps").then((m) => m.OrgLocationMap),
  { ssr: false, loading: () => <Skeleton className="h-[240px] w-full rounded-xl" /> },
);

export type { MapMarker };
