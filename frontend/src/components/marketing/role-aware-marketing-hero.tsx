"use client";

import Link from "next/link";
import { ArrowRight, Building2, LayoutGrid, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isResidentOnlyUser,
  orgHomePath,
  resolveAppHome,
} from "@/lib/navigation/app-routing";
import {
  ownerMarketingQuotes,
  residentHomeQuotes,
  residentMarketingQuotes,
} from "@/lib/copy/home-messaging";
import { useAuth } from "@/hooks/use-auth";
import { useMyMemberships } from "@/hooks/use-memberships";
import { cn } from "@/lib/utils";

export function RoleAwareMarketingHero() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, sessionReady } = useAuth();
  const { data: memberships = [] } = useMyMemberships();

  useEffect(() => setMounted(true), []);

  const showOwner =
    mounted && sessionReady && isAuthenticated && !isResidentOnlyUser(memberships);

  const showResidentWithStay =
    mounted &&
    sessionReady &&
    isAuthenticated &&
    isResidentOnlyUser(memberships) &&
    memberships.length > 0;

  const quotes = showOwner
    ? ownerMarketingQuotes
    : showResidentWithStay
      ? residentHomeQuotes
      : residentMarketingQuotes;

  return (
    <section className="border-b bg-gradient-to-b from-teal-50/80 to-background dark:from-teal-950/20">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-medium text-teal-600 dark:text-teal-400">{quotes.eyebrow}</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{quotes.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{quotes.description}</p>
        </div>

        {showOwner ? (
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href={resolveAppHome(memberships)} className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              <Building2 className="size-4" />
              Go to my organizations
            </Link>
            <Link
              href="/app/organizations/new"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Add property
            </Link>
          </div>
        ) : showResidentWithStay ? (
          <div className="mx-auto mt-8 flex max-w-lg flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href={orgHomePath(memberships[0])}
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              Open my stay
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href={`/app/${memberships[0].organizationSlug}/resident/accommodation`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}
            >
              <LayoutGrid className="size-4" />
              Building layout
            </Link>
            <Link href="/app/profile" className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}>
              Account settings
            </Link>
          </div>
        ) : (
          <form
            action="/explore"
            method="get"
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" placeholder="Search by name, city, or area…" className="pl-9" />
            </div>
            <button type="submit" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              Explore stays
              <ArrowRight className="size-4" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
