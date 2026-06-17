"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media/resolve-url";
import { cn } from "@/lib/utils";

export interface OrgGalleryPhoto {
  id: string;
  url: string;
  caption?: string | null;
}

interface OrgPhotoGalleryProps {
  photos: OrgGalleryPhoto[];
  className?: string;
}

export function OrgPhotoGallery({ photos, className }: OrgPhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!photos.length) return null;

  const active = photos[activeIndex] ?? photos[0];
  const activeSrc = resolveMediaUrl(active.url);

  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Property photos
      </h2>
      {activeSrc && (
        <div className="overflow-hidden rounded-xl border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeSrc}
            alt={active.caption ?? "Property photo"}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      )}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, index) => {
            const thumbSrc = resolveMediaUrl(photo.url);
            if (!thumbSrc) return null;
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                  index === activeIndex ? "border-teal-600" : "border-transparent opacity-80 hover:opacity-100",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbSrc}
                  alt={photo.caption ?? `Photo ${index + 1}`}
                  className="size-16 object-cover sm:size-20"
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
