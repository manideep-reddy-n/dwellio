import type { OrganizationType } from "@/types/enums";

export { DEFAULT_MAP_CENTER } from "@/lib/maps/config";

export const orgTypeMarkerColors: Record<OrganizationType, string> = {
  HOSTEL: "#0d9488",
  PG: "#2563eb",
  CO_LIVING: "#7c3aed",
  GATED_COMMUNITY: "#d97706",
};

export const orgTypeMarkerLabels: Record<OrganizationType, string> = {
  HOSTEL: "Hostel",
  PG: "PG",
  CO_LIVING: "Co-living",
  GATED_COMMUNITY: "Gated community",
};

export interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
  city?: string;
  area?: string;
  state?: string;
  postalCode?: string;
  addressLine?: string;
}

export function parseCoordinate(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export interface NominatimAddress {
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  village?: string;
  city_district?: string;
  city?: string;
  town?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface NominatimResult {
  place_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  address: NominatimAddress;
}

/** Parse a Nominatim result into Dwellio address fields. */
export function nominatimResultToPlace(result: NominatimResult): GeocodeResult {
  const address = result.address || {};
  return {
    displayName: result.display_name,
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    city: address.city || address.town || address.county || address.city_district,
    area: address.suburb || address.neighbourhood || address.village,
    state: address.state,
    postalCode: address.postcode,
    addressLine: address.road || undefined,
  };
}
