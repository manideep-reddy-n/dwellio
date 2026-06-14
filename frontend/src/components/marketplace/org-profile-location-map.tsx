"use client";

import { OrgLocationMap } from "@/components/maps/dynamic-maps";

interface OrgProfileLocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

export function OrgProfileLocationMap({ latitude, longitude, name }: OrgProfileLocationMapProps) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold">Location</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Interactive map — zoom and pan to see where {name} is located.
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border">
        <OrgLocationMap lat={latitude} lng={longitude} height={280} />
      </div>
    </section>
  );
}
