"use client";

import Link from "next/link";
import { PageTransition } from "@/components/shared/page-transition";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyMemberships } from "@/hooks/use-memberships";
import { membershipToOrgContext } from "@/lib/org/context";
import { canAccessOperations } from "@/lib/permissions/evaluate";
import { useOrgStore } from "@/stores/org-store";
import { cn } from "@/lib/utils";

export default function OrganizationsPage() {
  const setActiveOrg = useOrgStore((s) => s.setActiveOrg);
  const { data: memberships = [], isLoading, isError } = useMyMemberships();

  return (
    <PageTransition>
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My organizations</h1>
            <p className="mt-1 text-muted-foreground">
              Organizations where you have an active membership.
            </p>
          </div>
          <Link href="/app/organizations/new" className={cn(buttonVariants())}>
            Create organization
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}

          {isError && (
            <p className="text-sm text-destructive">Could not load memberships.</p>
          )}

          {!isLoading && memberships.length === 0 && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">No organizations yet</CardTitle>
                <CardDescription>
                  Create a property or request to join one from the marketplace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/explore" className={cn(buttonVariants({ variant: "outline" }))}>
                  Explore marketplace
                </Link>
              </CardContent>
            </Card>
          )}

          {memberships.map((membership) => {
            const href = canAccessOperations(membership.permissions, membership.ownerRole)
              ? `/app/${membership.organizationSlug}/operations/live`
              : `/app/${membership.organizationSlug}/resident`;

            return (
              <Card key={membership.organizationId}>
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{membership.organizationName}</p>
                    <p className="text-sm text-muted-foreground">
                      {membership.roleName} · {membership.accommodationMode.replace("_", " ")}
                    </p>
                  </div>
                  <Link
                    href={href}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    onClick={() => setActiveOrg(membershipToOrgContext(membership))}
                  >
                    Open
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
