"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Crosshair, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlaceSearchInput } from "@/components/maps/place-search-input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_MAP_CENTER,
  parseCoordinate,
  type GeocodeResult,
} from "@/lib/maps/geocoding";
import { getCurrentPosition, type GeolocationStatus } from "@/lib/maps/geolocation";
import { toast } from "sonner";

const LocationPickerMap = dynamic(
  () => import("@/components/maps/osm-maps").then((m) => m.LocationPickerMap),
  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-xl" /> },
);

export interface LocationValue {
  latitude: number;
  longitude: number;
  city?: string;
  area?: string;
  state?: string;
  postalCode?: string;
  addressLine?: string;
}

interface LocationPickerProps {
  value: LocationValue | null;
  onChange: (value: LocationValue) => void;
  onAddressFields?: (fields: Partial<LocationValue>) => void;
}

export function LocationPicker({ value, onChange, onAddressFields }: LocationPickerProps) {
  const [geoStatus, setGeoStatus] = useState<GeolocationStatus>("idle");
  const lat = value?.latitude ?? DEFAULT_MAP_CENTER.lat;
  const lng = value?.longitude ?? DEFAULT_MAP_CENTER.lng;

  useEffect(() => {
    if (value?.latitude != null && value?.longitude != null) return;

    setGeoStatus("requesting");
    void getCurrentPosition().then((position) => {
      if (!position) {
        setGeoStatus("denied");
        return;
      }
      setGeoStatus("granted");
      onChange({
        latitude: position.latitude,
        longitude: position.longitude,
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  function applyPlace(place: GeocodeResult) {
    const next: LocationValue = {
      latitude: place.lat,
      longitude: place.lng,
      city: place.city,
      area: place.area,
      state: place.state,
      postalCode: place.postalCode,
      addressLine: place.addressLine,
    };
    onChange(next);
    onAddressFields?.(next);
  }

  function moveMarker(newLat: number, newLng: number) {
    onChange({
      ...(value ?? {}),
      latitude: newLat,
      longitude: newLng,
    });
  }

  async function useCurrentLocation() {
    setGeoStatus("requesting");
    const position = await getCurrentPosition();
    if (!position) {
      setGeoStatus("denied");
      toast.error("Location permission denied or unavailable");
      return;
    }
    setGeoStatus("granted");
    moveMarker(position.latitude, position.longitude);
    toast.success("Using your current location");
  }

  return (
    <div className="space-y-3">
      <PlaceSearchInput onSelect={applyPlace} />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={geoStatus === "requesting"}
          onClick={() => void useCurrentLocation()}
        >
          {geoStatus === "requesting" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Crosshair className="size-3.5" />
          )}
          Use my location
        </Button>
        {geoStatus === "denied" && (
          <span className="text-xs text-muted-foreground">
            Allow location access in your browser for automatic pin placement.
          </span>
        )}
      </div>

      <LocationPickerMap lat={lat} lng={lng} onChange={moveMarker} />

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5" />
        Drag the pin, click the map, or search places.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="manual-lat">Latitude</Label>
          <Input
            id="manual-lat"
            inputMode="decimal"
            value={value?.latitude ?? ""}
            onChange={(e) => {
              const parsed = parseCoordinate(e.target.value);
              if (parsed != null) moveMarker(parsed, lng);
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="manual-lng">Longitude</Label>
          <Input
            id="manual-lng"
            inputMode="decimal"
            value={value?.longitude ?? ""}
            onChange={(e) => {
              const parsed = parseCoordinate(e.target.value);
              if (parsed != null) moveMarker(lat, parsed);
            }}
          />
        </div>
      </div>
    </div>
  );
}
