"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import { X } from "lucide-react";
import type { OrganizationType } from "@/types/enums";
import { DEFAULT_MAP_CENTER, orgTypeMarkerColors } from "@/lib/maps/geocoding";
import { orgTypeLabels } from "@/lib/marketplace/format";
import { GOOGLE_MAP_ID } from "@/lib/maps/config";
import { cn } from "@/lib/utils";

function MapPin({ color, selected }: { color: string; selected?: boolean }) {
  return (
    <svg
      width={selected ? 34 : 28}
      height={selected ? 44 : 36}
      viewBox="0 0 28 36"
      className="drop-shadow-md transition-transform"
      style={{ transform: selected ? "scale(1.08)" : undefined }}
    >
      <path
        d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z"
        fill={color}
        stroke="white"
        strokeWidth="2"
      />
      <circle cx="14" cy="14" r="5" fill="white" fillOpacity="0.95" />
    </svg>
  );
}

function FitMapBounds({ markers }: { markers: Array<{ lat: number; lng: number }> }) {
  const map = useMap();

  useEffect(() => {
    if (!map || markers.length === 0) return;

    if (markers.length === 1) {
      map.setCenter({ lat: markers[0].lat, lng: markers[0].lng });
      map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
    map.fitBounds(bounds, 48);
  }, [map, markers]);

  return null;
}

function CtrlMapHint({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-10 bg-background/80 px-3 py-2 text-center text-xs text-muted-foreground backdrop-blur-sm",
        className,
      )}
    >
      Hold <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd> to
      zoom and pan the map
    </div>
  );
}

function useCtrlMapGestures() {
  const [ctrlHeld, setCtrlHeld] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(window.matchMedia("(pointer: fine)").matches);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control") setCtrlHeld(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control") setCtrlHeld(false);
    };
    const onBlur = () => setCtrlHeld(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const gestureHandling = isDesktop && !ctrlHeld ? "none" : "greedy";
  const showHint = isDesktop && !ctrlHeld;

  return { gestureHandling, showHint };
}

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}

export function LocationPickerMap({ lat, lng, onChange, height = 280 }: LocationPickerMapProps) {
  const [position, setPosition] = useState({ lat, lng });
  const { gestureHandling, showHint } = useCtrlMapGestures();

  useEffect(() => {
    setPosition({ lat, lng });
  }, [lat, lng]);

  return (
    <div className="relative overflow-hidden rounded-xl border" style={{ height }}>
      {showHint && <CtrlMapHint />}
      <Map
        mapId={GOOGLE_MAP_ID}
        defaultCenter={position}
        defaultZoom={15}
        gestureHandling={gestureHandling}
        style={{ width: "100%", height: "100%" }}
        onClick={(event) => {
          const latLng = event.detail.latLng;
          if (!latLng) return;
          const next = { lat: latLng.lat, lng: latLng.lng };
          setPosition(next);
          onChange(next.lat, next.lng);
        }}
      >
        <AdvancedMarker
          position={position}
          draggable
          onDragEnd={(event) => {
            const latLng = event.latLng;
            if (!latLng) return;
            const next = { lat: latLng.lat(), lng: latLng.lng() };
            setPosition(next);
            onChange(next.lat, next.lng);
          }}
        >
          <MapPin color="#0d9488" />
        </AdvancedMarker>
      </Map>
    </div>
  );
}

export interface MapMarker {
  id: string;
  slug: string;
  name: string;
  type: OrganizationType;
  lat: number;
  lng: number;
  city?: string;
  area?: string | null;
}

interface ExploreMarkersMapProps {
  markers: MapMarker[];
  height?: number;
}

export function ExploreMarkersMap({ markers, height = 420 }: ExploreMarkersMapProps) {
  const [selected, setSelected] = useState<MapMarker | null>(null);
  const { gestureHandling, showHint } = useCtrlMapGestures();

  const center = useMemo(
    () =>
      markers[0]
        ? { lat: markers[0].lat, lng: markers[0].lng }
        : { lat: DEFAULT_MAP_CENTER.lat, lng: DEFAULT_MAP_CENTER.lng },
    [markers],
  );

  const boundsPoints = useMemo(
    () => markers.map((m) => ({ lat: m.lat, lng: m.lng })),
    [markers],
  );

  return (
    <div className="relative overflow-hidden rounded-xl border" style={{ height }}>
      {showHint && <CtrlMapHint />}
      <Map
        mapId={GOOGLE_MAP_ID}
        defaultCenter={center}
        defaultZoom={markers.length === 1 ? 14 : 11}
        gestureHandling={gestureHandling}
        style={{ width: "100%", height: "100%" }}
        onClick={() => setSelected(null)}
      >
        <FitMapBounds markers={boundsPoints} />
        {markers.map((marker) => (
          <AdvancedMarker
            key={marker.id}
            position={{ lat: marker.lat, lng: marker.lng }}
            onClick={(e) => {
              e.domEvent.stopPropagation();
              setSelected(marker);
            }}
          >
            <MapPin
              color={orgTypeMarkerColors[marker.type]}
              selected={selected?.id === marker.id}
            />
          </AdvancedMarker>
        ))}
      </Map>

      {selected && (
        <div className="absolute bottom-4 left-1/2 z-20 w-[min(92%,280px)] -translate-x-1/2 rounded-xl border bg-background p-4 shadow-lg">
          <button
            type="button"
            className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-muted"
            onClick={() => setSelected(null)}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
          <p className="pr-6 text-sm font-semibold leading-snug">{selected.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {orgTypeLabels[selected.type]}
            {selected.area ? ` · ${selected.area}` : ""}
            {selected.city ? `, ${selected.city}` : ""}
          </p>
          <Link
            href={`/${selected.slug}`}
            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            View details
          </Link>
        </div>
      )}
    </div>
  );
}

interface OrgLocationMapProps {
  lat: number;
  lng: number;
  label?: string;
  height?: number;
}

export function OrgLocationMap({ lat, lng, height = 240 }: OrgLocationMapProps) {
  const { gestureHandling, showHint } = useCtrlMapGestures();

  return (
    <div className="relative overflow-hidden rounded-xl border" style={{ height }}>
      {showHint && <CtrlMapHint />}
      <Map
        mapId={GOOGLE_MAP_ID}
        defaultCenter={{ lat, lng }}
        defaultZoom={15}
        gestureHandling={gestureHandling}
        disableDefaultUI={false}
        style={{ width: "100%", height: "100%" }}
      >
        <AdvancedMarker position={{ lat, lng }}>
          <MapPin color="#0d9488" />
        </AdvancedMarker>
      </Map>
    </div>
  );
}
