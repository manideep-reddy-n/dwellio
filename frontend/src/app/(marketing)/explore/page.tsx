import type { Metadata } from "next";
import { Suspense } from "react";
import { OrgCard } from "@/components/marketplace/org-card";
import { ExploreFilters } from "@/components/marketplace/explore-filters";
import { ExploreMapSection } from "@/components/marketplace/explore-map-section";
import { PageTransition } from "@/components/shared/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMarketplaceOrgs } from "@/lib/api/marketplace-server";
import type { OrganizationType } from "@/types/enums";

export const metadata: Metadata = {
  title: "Explore stays",
};

interface ExplorePageProps {
  searchParams: Promise<{ city?: string; type?: string; q?: string }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const filters = {
    city: params.city,
    type: params.type as OrganizationType | undefined,
    q: params.q,
  };

  let orgs: Awaited<ReturnType<typeof fetchMarketplaceOrgs>> = [];
  let error = false;
  try {
    orgs = await fetchMarketplaceOrgs(filters);
  } catch {
    error = true;
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Explore stays</h1>
        <p className="mt-1 text-muted-foreground">
          Browse verified hostels, PGs, co-living spaces, and gated communities.
        </p>

        <div className="mt-6">
          <Suspense fallback={<Skeleton className="h-32 w-full rounded-xl" />}>
            <ExploreFilters />
          </Suspense>
        </div>

        <Suspense fallback={<Skeleton className="mt-8 h-[420px] w-full rounded-xl" />}>
          <ExploreMapSection orgs={orgs} />
        </Suspense>

        <div className="mt-8">
          {error ? (
            <p className="text-sm text-destructive">
              Could not load listings. Is the backend running?
            </p>
          ) : orgs.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No verified organizations match your filters.
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {orgs.length} result{orgs.length === 1 ? "" : "s"}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {orgs.map((org) => (
                  <OrgCard key={org.id} org={org} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
