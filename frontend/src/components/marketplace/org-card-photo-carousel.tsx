"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media/resolve-url";
import { cn } from "@/lib/utils";

interface OrgCardPhotoCarouselProps {
  photos: Array<{ url: string; caption?: string | null }>;
  orgName: string;
  href: string;
}

export function OrgCardPhotoCarousel({ photos, orgName, href }: OrgCardPhotoCarouselProps) {
  const resolved = useMemo(
    () =>
      photos
        .map((photo) => ({ ...photo, src: resolveMediaUrl(photo.url) }))
        .filter((photo): photo is typeof photo & { src: string } => Boolean(photo.src)),
    [photos],
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [resolved.length]);

  if (resolved.length === 0) {
    return (
      <Link href={href} className="block">
        <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100 dark:from-teal-950/30 dark:to-slate-900">
          <Building2 className="size-10 text-teal-600/40" />
        </div>
      </Link>
    );
  }

  const active = resolved[index] ?? resolved[0];

  function goPrev(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIndex((current) => (current - 1 + resolved.length) % resolved.length);
  }

  function goNext(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIndex((current) => (current + 1) % resolved.length);
  }

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
      <Link href={href} className="block size-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.src}
          alt={active.caption ?? `${orgName} property`}
          className="size-full object-cover transition-opacity duration-300"
        />
      </Link>

      {resolved.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/55"
            onClick={goPrev}
          >
            <FilledChevron direction="left" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            className="absolute right-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/55"
            onClick={goNext}
          >
            <FilledChevron direction="right" />
          </button>

          <div
            className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 bg-gradient-to-t from-black/45 to-transparent px-3 pb-2.5 pt-6"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {resolved.map((photo, dotIndex) => (
              <button
                key={`${photo.src}-${dotIndex}`}
                type="button"
                aria-label={`Show photo ${dotIndex + 1} of ${resolved.length}`}
                className={cn(
                  "size-2 rounded-full transition-all",
                  dotIndex === index ? "scale-110 bg-white" : "bg-white/50 hover:bg-white/80",
                )}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIndex(dotIndex);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FilledChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-4"
      fill="currentColor"
    >
      {direction === "left" ? (
        <path d="M14.3 5.71a1 1 0 0 0-1.41 0L7.46 11.12a1 1 0 0 0 0 1.41l5.43 5.41a1 1 0 0 0 1.41-1.41L10.29 12l4.01-3.88a1 1 0 0 0 0-1.41Z" />
      ) : (
        <path d="M9.7 5.71a1 1 0 0 1 1.41 0l5.43 5.41a1 1 0 0 1 0 1.41l-5.43 5.41a1 1 0 0 1-1.41-1.41L13.71 12 9.7 8.12a1 1 0 0 1 0-1.41Z" />
      )}
    </svg>
  );
}
