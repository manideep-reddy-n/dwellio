"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { OrganizationType } from "@/types/enums";
import { orgTypeMarkerColors } from "@/lib/maps/geocoding";
import { orgTypeLabels } from "@/lib/marketplace/format";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

// Fix leaflet icon issues with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function createCustomIcon(color: string) {
  const svg = `
    <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="14" r="5" fill="white" fill-opacity="0.95"/>
    </svg>
  `;
  return new L.DivIcon({
    className: "bg-transparent border-none",
    html: svg,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

function FitMapBounds({ markers }: { markers: Array<{ lat: number; lng: number }> }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;

    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 14);
      return;
    }

    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [map, markers]);

  return null;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}

export function LocationPickerMap({ lat, lng, onChange, height = 280 }: LocationPickerMapProps) {
  const position = [lat, lng] as [number, number];
  const icon = useMemo(() => createCustomIcon("#0d9488"), []);

  return (
    <div className="relative overflow-hidden rounded-xl border" style={{ height }}>
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={position}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const { lat, lng } = marker.getLatLng();
              onChange(lat, lng);
            },
          }}
          icon={icon}
        />
        <ClickHandler onChange={onChange} />
        <MapUpdater center={position} />
      </MapContainer>
    </div>
  );
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export interface MapMarker {
  id: string;
  slug: string;
  name: string;
  type: OrganizationType;
  lat: number;
  lng: number;
  city?: string;
  area?: string;
}

interface ExploreMarkersMapProps {
  markers: MapMarker[];
}

export function ExploreMarkersMap({ markers }: ExploreMarkersMapProps) {
  const defaultPosition = [20.5937, 78.9629] as [number, number]; // India

  return (
    <div className="relative h-[420px] overflow-hidden rounded-xl border bg-muted/20">
      <MapContainer
        center={defaultPosition}
        zoom={4}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitMapBounds markers={markers} />
        
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={createCustomIcon(orgTypeMarkerColors[marker.type])}
          >
            <Popup className="dwellio-popup">
              <Link href={`/${marker.slug}`} className="block font-sans hover:no-underline">
                <div className="font-semibold text-foreground hover:text-primary transition-colors">
                  {marker.name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {[marker.area, marker.city].filter(Boolean).join(", ")}
                </div>
                <div className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {orgTypeLabels[marker.type]}
                </div>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

interface OrgLocationMapProps {
  lat: number;
  lng: number;
  height?: number;
}

export function OrgLocationMap({ lat, lng, height = 240 }: OrgLocationMapProps) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground" style={{ height }}>
        Map coordinates unavailable
      </div>
    );
  }

  const icon = createCustomIcon("#0d9488");

  return (
    <div className="relative overflow-hidden rounded-xl border bg-muted/20" style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={icon} />
      </MapContainer>
    </div>
  );
}
