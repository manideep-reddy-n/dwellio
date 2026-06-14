"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { NotifyMeButton } from "@/components/marketplace/notify-me-button";
import { hasOpenAvailability, isPropertyFull } from "@/lib/marketplace/availability";
import type { PublicOrganizationMetrics } from "@/types/api/marketplace";
import { cn } from "@/lib/utils";

interface OrgProfileActionsProps {
  slug: string;
  metrics: PublicOrganizationMetrics;
}

export function OrgProfileActions({ slug, metrics }: OrgProfileActionsProps) {
  const full = isPropertyFull(metrics);
  const open = hasOpenAvailability(metrics);

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {open && (
        <Link href={`/${slug}/join`} className={cn(buttonVariants({ size: "lg" }), "flex-1 sm:flex-none")}>
          Request to join
        </Link>
      )}
      {full && (
        <>
          <NotifyMeButton slug={slug} full size="lg" className="flex-1 sm:flex-none" />
          <p className="text-sm text-muted-foreground sm:basis-full">
            This property is currently full. Turn on alerts and we will notify you when a bed or unit opens.
          </p>
        </>
      )}
      {!open && !full && (
        <p className="text-sm text-muted-foreground">
          Availability is being updated. Check back soon or contact the property directly.
        </p>
      )}
    </div>
  );
}
