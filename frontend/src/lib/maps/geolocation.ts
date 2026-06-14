export interface GeoPosition {
  latitude: number;
  longitude: number;
}

export type GeolocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

/** Request browser geolocation; returns null if denied or unavailable. */
export function getCurrentPosition(): Promise<GeoPosition | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  });
}
