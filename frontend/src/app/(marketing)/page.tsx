import type { Metadata } from "next";
import Link from "next/link";
import { OrgCard } from "@/components/marketplace/org-card";
import { RoleAwareMarketingHero } from "@/components/marketing/role-aware-marketing-hero";
import { PageTransition } from "@/components/shared/page-transition";
import { buttonVariants } from "@/components/ui/button";
import { fetchMarketplaceOrgs } from "@/lib/api/marketplace-server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Home",
};

export default async function MarketplaceHomePage() {
  let featured: Awaited<ReturnType<typeof fetchMarketplaceOrgs>> = [];
  try {
    featured = (await fetchMarketplaceOrgs()).slice(0, 6);
  } catch {
    featured = [];
  }

  return (
    <PageTransition>
      <RoleAwareMarketingHero />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Featured stays</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Verified properties ranked by service quality and resident feedback.
            </p>
          </div>
          <Link href="/explore" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            View all
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((org) => (
              <OrgCard key={org.id} org={org} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            <p>No verified listings yet.</p>
            <p className="mt-2">
              Property owners can{" "}
              <Link href="/register" className="text-primary underline-offset-4 hover:underline">
                register
              </Link>{" "}
              and get verified to appear here.
            </p>
          </div>
        )}
      </section>
    </PageTransition>
  );
}
