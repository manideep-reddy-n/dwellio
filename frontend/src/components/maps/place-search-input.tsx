"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { geocoderResultToPlace, type GeocodeResult } from "@/lib/maps/geocoding";

interface PlaceSearchInputProps {
  onSelect: (place: GeocodeResult) => void;
}

export function PlaceSearchInput({ onSelect }: PlaceSearchInputProps) {
  const places = useMapsLibrary("places");
  const geocoding = useMapsLibrary("geocoding");
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!places || query.trim().length < 3) {
      setPredictions([]);
      return;
    }

    const service = new places.AutocompleteService();
    const timer = setTimeout(() => {
      setSearching(true);
      service.getPlacePredictions(
        {
          input: query.trim(),
          componentRestrictions: { country: "in" },
        },
        (results) => {
          setPredictions(results ?? []);
          setSearching(false);
        },
      );
    }, 350);

    return () => clearTimeout(timer);
  }, [places, query]);

  function selectPrediction(prediction: google.maps.places.AutocompletePrediction) {
    if (!geocoding) return;

    const geocoder = new geocoding.Geocoder();
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status !== "OK" || !results?.[0]) return;
      const place = geocoderResultToPlace(results[0]);
      onSelect({ ...place, displayName: prediction.description });
      setQuery(prediction.description);
      setPredictions([]);
    });
  }

  return (
    <div className="space-y-1">
      <Label htmlFor="place-search">Search location</Label>
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="place-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search address, area, or landmark…"
          className="pl-9"
          autoComplete="off"
        />
      </div>
      {searching && <p className="text-xs text-muted-foreground">Searching places…</p>}
      {predictions.length > 0 && (
        <ul className="max-h-40 overflow-y-auto rounded-lg border bg-background text-sm shadow-sm">
          {predictions.map((prediction) => (
            <li key={prediction.place_id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted"
                onClick={() => selectPrediction(prediction)}
              >
                {prediction.description}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
