"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { LogOut } from "lucide-react";
import { OrganizationLogo } from "@/components/shared/organization-logo";
import { buttonVariants } from "@/components/ui/button";
import { residentHomeQuotes } from "@/lib/copy/home-messaging";
import { useOrgStore } from "@/stores/org-store";
import { cn } from "@/lib/utils";

interface ResidentHomeHeroProps {
  orgName: string;
  orgSlug: string;
  orgLogoUrl?: string | null;
}

export function ResidentHomeHero({
  orgName,
  orgSlug: orgSlugProp,
  orgLogoUrl,
}: ResidentHomeHeroProps) {
  const params = useParams<{ orgSlug?: string }>();
  const activeLogo = useOrgStore((s) => s.activeOrg?.logoUrl);
  const storeSlug = useOrgStore((s) => s.activeOrg?.slug);
  const orgSlug = orgSlugProp || params.orgSlug || storeSlug || "";
  const logoUrl = orgLogoUrl ?? activeLogo;

  return (
    <section className="rounded-xl border bg-gradient-to-br from-sky-50/80 to-background p-6 dark:from-sky-950/20 sm:p-8">
      <div className="flex items-start gap-4">
        <OrganizationLogo name={orgName} logoUrl={logoUrl} size="lg" className="mt-1" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-sky-700 dark:text-sky-400">
            {residentHomeQuotes.eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {residentHomeQuotes.title}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {orgName} — {residentHomeQuotes.description}
          </p>
        </div>
      </div>

      {orgSlug ? (
        <div className="mt-6">
          <Link
            href="/app/profile"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 text-muted-foreground")}
          >
            <LogOut className="size-4" />
            Leave org / account
          </Link>
        </div>
      ) : null}
    </section>
  );
}
