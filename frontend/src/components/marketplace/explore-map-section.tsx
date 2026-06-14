"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ExploreMarkersMap, type MapMarker } from "@/components/maps/dynamic-maps";
import { orgTypeMarkerColors } from "@/lib/maps/geocoding";
import { orgTypeLabels } from "@/lib/marketplace/format";
import type { PublicOrganizationSummary } from "@/types/api/marketplace";
import type { OrganizationType } from "@/types/enums";

interface ExploreMapSectionProps {
  orgs: PublicOrganizationSummary[];
}

function ExploreMapContent({ orgs }: ExploreMapSectionProps) {
  const searchParams = useSearchParams();
  const city = searchParams.get("city") ?? undefined;
  const type = (searchParams.get("type") as OrganizationType | null) ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const textFiltered = orgs.filter((org) => {
    if (city && !org.city.toLowerCase().includes(city.toLowerCase())) return false;
    if (type && org.type !== type) return false;
    if (q) {
      const hay = `${org.name} ${org.city} ${org.area ?? ""} ${org.description ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const markers: MapMarker[] = textFiltered
    .filter((org) => org.latitude != null && org.longitude != null)
    .map((org) => ({
      id: org.id,
      slug: org.slug,
      name: org.name,
      type: org.type,
      lat: Number(org.latitude),
      lng: Number(org.longitude),
      city: org.city,
      area: org.area,
    }))
    .filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));

  const missingCoords = textFiltered.length - markers.length;

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Map view</h2>
          <p className="text-sm text-muted-foreground">
            {markers.length} on map
            {textFiltered.length > 0 &&
              ` · ${textFiltered.length} listing${textFiltered.length === 1 ? "" : "s"} total`}
            {missingCoords > 0 && ` · ${missingCoords} without pin location`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {(Object.keys(orgTypeMarkerColors) as OrganizationType[]).map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block size-3 rounded-full border-2 border-white shadow"
                style={{ background: orgTypeMarkerColors[t] }}
              />
              {orgTypeLabels[t]}
            </span>
          ))}
        </div>
      </div>

      {markers.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {textFiltered.length === 0 ? (
            <>No listings match your filters.</>
          ) : (
            <>
              {textFiltered.length} listing{textFiltered.length === 1 ? "" : "s"} found, but none have map
              coordinates yet.
            </>
          )}
        </div>
      ) : (
        <ExploreMarkersMap markers={markers} />
      )}
    </section>
  );
}

export function ExploreMapSection({ orgs }: ExploreMapSectionProps) {
  return (
    <Suspense fallback={<div className="mt-10 h-[420px] animate-pulse rounded-xl border bg-muted/30" />}>
      <ExploreMapContent orgs={orgs} />
    </Suspense>
  );
}
