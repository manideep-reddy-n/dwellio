"use client";

import Link from "next/link";
import { LayoutGrid, LogOut, Megaphone, MessageSquare, Star, Wallet } from "lucide-react";
import { OrganizationLogo } from "@/components/shared/organization-logo";
import { buttonVariants } from "@/components/ui/button";
import { residentHomeQuotes } from "@/lib/copy/home-messaging";
import { useOrgStore } from "@/stores/org-store";
import { cn } from "@/lib/utils";

interface ResidentHomeHeroProps {
  orgName: string;
  orgSlug: string;
  orgLogoUrl?: string | null;
  openComplaints?: number;
}

export function ResidentHomeHero({
  orgName,
  orgSlug,
  orgLogoUrl,
  openComplaints = 0,
}: ResidentHomeHeroProps) {
  const activeLogo = useOrgStore((s) => s.activeOrg?.logoUrl);
  const logoUrl = orgLogoUrl ?? activeLogo;

  return (
    <section className="rounded-xl border bg-gradient-to-br from-sky-50/80 to-background p-6 dark:from-sky-950/20 sm:p-8">
      <div className="flex items-start gap-4">
        <OrganizationLogo name={orgName} logoUrl={logoUrl} size="lg" className="mt-1" />
        <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-sky-700 dark:text-sky-400">{residentHomeQuotes.eyebrow}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{residentHomeQuotes.title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {orgName} — {residentHomeQuotes.description}
      </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={`/app/${orgSlug}/resident/complaints`}
          className={cn(buttonVariants({ size: "sm" }), "gap-2")}
        >
          <MessageSquare className="size-4" />
          My complaints
          {openComplaints > 0 && (
            <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs">{openComplaints}</span>
          )}
        </Link>
        <Link
          href={`/app/${orgSlug}/resident/announcements`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
        >
          <Megaphone className="size-4" />
          Announcements
        </Link>
        <Link
          href={`/app/${orgSlug}/resident/accommodation`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
        >
          <LayoutGrid className="size-4" />
          Building layout
        </Link>
        <Link
          href={`/app/${orgSlug}/resident/payments`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
        >
          <Wallet className="size-4" />
          My rent
        </Link>
        <Link
          href={`/app/${orgSlug}/resident/review`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
        >
          <Star className="size-4" />
          My review
        </Link>
        <Link
          href="/app/profile"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 text-muted-foreground")}
        >
          <LogOut className="size-4" />
          Leave org / account
        </Link>
      </div>
    </section>
  );
}
