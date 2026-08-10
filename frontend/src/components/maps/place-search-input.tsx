"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nominatimResultToPlace, type GeocodeResult, type NominatimResult } from "@/lib/maps/geocoding";

interface PlaceSearchInputProps {
  onSelect: (place: GeocodeResult) => void;
}

export function PlaceSearchInput({ onSelect }: PlaceSearchInputProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      setPredictions([]);
      return;
    }

    const timer = setTimeout(() => {
      setSearching(true);
      
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", query.trim());
      url.searchParams.set("format", "json");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("countrycodes", "in");
      url.searchParams.set("limit", "5");

      fetch(url.toString(), {
        headers: {
          "Accept-Language": "en-US,en;q=0.9",
        }
      })
        .then((res) => res.json())
        .then((data: NominatimResult[]) => {
          setPredictions(data ?? []);
        })
        .catch((err) => {
          console.error("Geocoding failed", err);
        })
        .finally(() => {
          setSearching(false);
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  function selectPrediction(prediction: NominatimResult) {
    const place = nominatimResultToPlace(prediction);
    onSelect({ ...place, displayName: prediction.display_name });
    setQuery(prediction.display_name);
    setPredictions([]);
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
            <li key={prediction.place_id || prediction.lat + prediction.lon}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted"
                onClick={() => selectPrediction(prediction)}
              >
                {prediction.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
