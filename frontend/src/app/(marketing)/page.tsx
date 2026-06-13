import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { OrgCard } from "@/components/marketplace/org-card";
import { PageTransition } from "@/components/shared/page-transition";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchMarketplaceOrgs } from "@/lib/api/marketplace-server";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export default async function MarketplaceHomePage() {
  let featured: Awaited<ReturnType<typeof fetchMarketplaceOrgs>> = [];
  try {
    featured = (await fetchMarketplaceOrgs()).slice(0, 6);
  } catch {
    featured = [];
  }

  return (
    <PageTransition>
      <section className="border-b bg-gradient-to-b from-teal-50/80 to-background dark:from-teal-950/20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-medium text-teal-600 dark:text-teal-400">
              Verified stays · Trust Score · Real-time ops
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Find your next stay with confidence
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{siteConfig.description}</p>
          </div>

          <form
            action="/explore"
            method="get"
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search by name, city, or area…"
                className="pl-9"
              />
            </div>
            <button type="submit" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              Explore
              <ArrowRight className="size-4" />
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Featured stays</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ranked by Trust Score inputs — ratings, response time, and resolution rate.
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
