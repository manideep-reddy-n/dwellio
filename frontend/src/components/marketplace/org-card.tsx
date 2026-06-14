import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { OrganizationLogo } from "@/components/shared/organization-logo";
import { TrustScoreBadge } from "@/components/marketplace/trust-score-badge";
import { VerifiedBadge } from "@/components/marketplace/verified-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatAvailability,
  formatLocation,
  formatRating,
  orgTypeLabels,
  trustInputFromMetrics,
} from "@/lib/marketplace/format";
import type { PublicOrganizationSummary } from "@/types/api/marketplace";
import { cn } from "@/lib/utils";

interface OrgCardProps {
  org: PublicOrganizationSummary;
  className?: string;
}

export function OrgCard({ org, className }: OrgCardProps) {
  const trustInput = trustInputFromMetrics(org.metrics, org.verified);

  return (
    <Link href={`/${org.slug}`} className={cn("group block", className)}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <OrganizationLogo name={org.name} logoUrl={org.logoUrl} size="md" />
            <div className="min-w-0 flex-1">
            <Badge variant="secondary" className="mb-2">
              {orgTypeLabels[org.type]}
            </Badge>
            {org.verified && <VerifiedBadge className="mb-2" />}
            <CardTitle className="truncate text-lg group-hover:text-teal-700 dark:group-hover:text-teal-400">
              {org.name}
            </CardTitle>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              {formatLocation(org.city, org.area)}
            </p>
          </div>
          </div>
          <TrustScoreBadge input={trustInput} size="sm" showLabel={false} />
        </CardHeader>
        <CardContent className="space-y-3">
          {org.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{org.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {formatRating(org.metrics.avgRating, org.metrics.reviewCount)}
            </span>
            <span className="text-muted-foreground">{formatAvailability(org.metrics)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
