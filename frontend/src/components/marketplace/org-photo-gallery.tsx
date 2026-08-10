"use client";

import { useState } from "react";
import Image from "next/image";
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

  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Property photos
      </h2>
      <div className="overflow-hidden rounded-xl border bg-muted relative aspect-[16/9] w-full">
        {photos.map((photo, i) => {
          const src = resolveMediaUrl(photo.url);
          if (!src) return null;
          return (
            <Image
              key={photo.id}
              src={src}
              alt={photo.caption ?? "Property photo"}
              fill
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 800px"
              className={cn(
                "object-cover transition-opacity duration-300 ease-in-out",
                i === activeIndex ? "opacity-100" : "opacity-0",
              )}
            />
          );
        })}
      </div>
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
                <div className="relative size-16 sm:size-20">
                  <Image
                    src={thumbSrc}
                    alt={photo.caption ?? `Photo ${index + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
