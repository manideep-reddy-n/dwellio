import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { OrganizationLogo } from "@/components/shared/organization-logo";
import { MetricsStrip } from "@/components/marketplace/metrics-strip";
import { MemberJoinBanner } from "@/components/marketplace/member-join-banner";
import { OrgPhotoGallery } from "@/components/marketplace/org-photo-gallery";
import { OrgProfileActionsGated } from "@/components/marketplace/org-profile-actions-gated";
import { OrgProfileLocationMap } from "@/components/marketplace/org-profile-location-map";
import { ReviewList } from "@/components/marketplace/review-list";
import { VerifiedBadge } from "@/components/marketplace/verified-badge";
import { TrustScoreBadge } from "@/components/marketplace/trust-score-badge";
import { TrustScoreBreakdown } from "@/components/marketplace/trust-score-breakdown";
import { PageTransition } from "@/components/shared/page-transition";
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
import { hostelAudienceLabel } from "@/lib/copy/home-messaging";

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

  const trustInput = trustInputFromMetrics(org.metrics, org.verified);

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <MemberJoinBanner
          organizationId={org.id}
          organizationSlug={slug}
          organizationName={org.name}
        />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <OrganizationLogo name={org.name} logoUrl={org.logoUrl} size="lg" />
            <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{orgTypeLabels[org.type]}</Badge>
              {hostelAudienceLabel(org.hostelAudience) && (
                <Badge variant="outline">{hostelAudienceLabel(org.hostelAudience)}</Badge>
              )}
              {org.verified && <VerifiedBadge />}
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
          </div>
          <TrustScoreBadge input={trustInput} size="lg" />
        </div>

        {org.amenities && org.amenities.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Amenities
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {org.amenities.map((amenity) => (
                <Badge key={amenity.name} variant="secondary">
                  {amenity.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <MetricsStrip type={org.type} metrics={org.metrics} />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <OrgProfileActionsGated organizationId={org.id} slug={slug} metrics={org.metrics} />
          {(org.contactPhone || org.contactEmail) && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {org.contactPhone && <span>{org.contactPhone}</span>}
              {org.contactEmail && <span>{org.contactEmail}</span>}
            </div>
          )}
        </div>

        {org.photos && org.photos.length > 0 && (
          <OrgPhotoGallery photos={org.photos} className="mt-10" />
        )}

        <Separator className="my-10" />

        {org.latitude != null && org.longitude != null && (
          <OrgProfileLocationMap
            latitude={org.latitude}
            longitude={org.longitude}
            name={org.name}
          />
        )}

        <TrustScoreBreakdown input={trustInput} className="mb-10" />

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
