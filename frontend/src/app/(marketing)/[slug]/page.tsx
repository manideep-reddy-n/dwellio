import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { MetricsStrip } from "@/components/marketplace/metrics-strip";
import { ReviewList } from "@/components/marketplace/review-list";
import { TrustScoreBadge } from "@/components/marketplace/trust-score-badge";
import { PageTransition } from "@/components/shared/page-transition";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  fetchMarketplaceOrg,
  fetchMarketplaceReviews,
} from "@/lib/api/marketplace-server";
import {
  formatLocation,
  orgTypeLabels,
  trustInputFromMetrics,
} from "@/lib/marketplace/format";
import { cn } from "@/lib/utils";

interface OrgProfilePageProps {
  params: Promise<{ slug: string }>;
}

export default async function OrgProfilePage({ params }: OrgProfilePageProps) {
  const { slug } = await params;

  let org: Awaited<ReturnType<typeof fetchMarketplaceOrg>>;
  let reviews: Awaited<ReturnType<typeof fetchMarketplaceReviews>>;

  try {
    [org, reviews] = await Promise.all([
      fetchMarketplaceOrg(slug),
      fetchMarketplaceReviews(slug),
    ]);
  } catch {
    notFound();
  }

  const trustInput = trustInputFromMetrics(org.metrics);

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{orgTypeLabels[org.type]}</Badge>
              <Badge variant="outline">Verified</Badge>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{org.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              {formatLocation(org.city, org.area)}
            </p>
            {org.description && (
              <p className="mt-4 leading-relaxed text-muted-foreground">{org.description}</p>
            )}
          </div>
          <TrustScoreBadge input={trustInput} size="lg" />
        </div>

        <div className="mt-8">
          <MetricsStrip type={org.type} metrics={org.metrics} />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/${slug}/join`}
            className={cn(buttonVariants({ size: "lg" }), "flex-1 sm:flex-none")}
          >
            Request to join
          </Link>
          {(org.contactPhone || org.contactEmail) && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {org.contactPhone && <span>{org.contactPhone}</span>}
              {org.contactEmail && <span>{org.contactEmail}</span>}
            </div>
          )}
        </div>

        <Separator className="my-10" />

        <section>
          <h2 className="text-xl font-semibold">Resident reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified residents share their experience after 7+ days of membership.
          </p>
          <div className="mt-6">
            <ReviewList reviews={reviews.slice(0, 5)} />
          </div>
          {reviews.length > 5 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Showing 5 of {reviews.length} reviews
            </p>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
