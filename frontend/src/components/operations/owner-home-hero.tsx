"use client";

import Link from "next/link";
import { ArrowRight, BedDouble, UserPlus, Wrench } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ownerHomeQuotes } from "@/lib/copy/home-messaging";
import { cn } from "@/lib/utils";

interface OwnerHomeHeroProps {
  orgName: string;
  orgSlug: string;
  pendingJoins?: number;
  openComplaints?: number;
}

export function OwnerHomeHero({
  orgName,
  orgSlug,
  pendingJoins = 0,
  openComplaints = 0,
}: OwnerHomeHeroProps) {
  return (
    <section className="rounded-xl border bg-gradient-to-br from-teal-50/80 to-background p-6 dark:from-teal-950/20 sm:p-8">
      <p className="text-sm font-medium text-teal-700 dark:text-teal-400">{ownerHomeQuotes.eyebrow}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{ownerHomeQuotes.title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {orgName} — {ownerHomeQuotes.description}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={`/app/${orgSlug}/operations/join-requests`}
          className={cn(buttonVariants({ size: "sm" }), "gap-2")}
        >
          <UserPlus className="size-4" />
          Join requests
          {pendingJoins > 0 && (
            <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs">{pendingJoins}</span>
          )}
        </Link>
        <Link
          href={`/app/${orgSlug}/operations/complaints`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
        >
          <Wrench className="size-4" />
          Complaints
          {openComplaints > 0 && (
            <span className="rounded-full bg-muted px-1.5 text-xs">{openComplaints}</span>
          )}
        </Link>
        <Link
          href={`/app/${orgSlug}/operations/accommodation`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
        >
          <BedDouble className="size-4" />
          Accommodation
        </Link>
        <Link
          href={`/app/${orgSlug}/operations/live`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}
        >
          Open live center
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
