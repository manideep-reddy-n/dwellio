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

function component(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
  short = false,
): string | undefined {
  const match = components.find((c) => c.types.includes(type));
  if (!match) return undefined;
  return short ? match.short_name : match.long_name;
}

/** Parse a Google Geocoder result into Dwellio address fields. */
export function geocoderResultToPlace(result: google.maps.GeocoderResult): GeocodeResult {
  const components = result.address_components ?? [];
  const location = result.geometry.location;

  return {
    displayName: result.formatted_address,
    lat: location.lat(),
    lng: location.lng(),
    city:
      component(components, "locality") ??
      component(components, "administrative_area_level_2") ??
      component(components, "administrative_area_level_1"),
    area:
      component(components, "sublocality_level_1") ??
      component(components, "sublocality") ??
      component(components, "neighborhood"),
    state: component(components, "administrative_area_level_1"),
    postalCode: component(components, "postal_code"),
    addressLine:
      [component(components, "street_number"), component(components, "route")]
        .filter(Boolean)
        .join(" ") || undefined,
  };
}
