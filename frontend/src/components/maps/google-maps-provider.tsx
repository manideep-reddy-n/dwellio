"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import type { ReactNode } from "react";
import { GOOGLE_MAPS_API_KEY } from "@/lib/maps/config";

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Google Maps API key is missing. Set{" "}
        <code className="text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in{" "}
        <code className="text-xs">.env.local</code>.
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["places", "geocoding", "marker"]}>
      {children}
    </APIProvider>
  );
}
