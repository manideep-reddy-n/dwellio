"use client";

import Link from "next/link";
import { PageTransition } from "@/components/shared/page-transition";
import { PageTitle } from "@/components/shared/page-title";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyMemberships } from "@/hooks/use-memberships";
import { membershipToOrgContext } from "@/lib/org/context";
import {
  canCreateOrganization,
  isResidentOnlyUser,
  orgHomePath,
} from "@/lib/navigation/app-routing";
import { useOrgStore } from "@/stores/org-store";
import { cn } from "@/lib/utils";

export default function OrganizationsPage() {
  const setActiveOrg = useOrgStore((s) => s.setActiveOrg);
  const { data: memberships = [], isLoading, isError } = useMyMemberships();
  const residentOnly = isResidentOnlyUser(memberships);
  const showCreate = canCreateOrganization(memberships);

  return (
    <PageTransition>
      <PageTitle title={residentOnly ? "My stays" : "My organizations"} />
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {residentOnly ? "My stays" : "My organizations"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {residentOnly
                ? "Properties where you are an active resident."
                : "Properties you own or manage."}
            </p>
          </div>
          {showCreate && (
            <Link href="/app/organizations/new" className={cn(buttonVariants())}>
              Create organization
            </Link>
          )}
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
                  Create your first property to start managing residents, complaints, and accommodation.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 sm:flex-row">
                <Link href="/app/organizations/new" className={cn(buttonVariants())}>
                  Create organization
                </Link>
                <Link href="/explore" className={cn(buttonVariants({ variant: "outline" }))}>
                  Explore marketplace
                </Link>
              </CardContent>
            </Card>
          )}

          {memberships.map((membership) => {
            const href = orgHomePath(membership);

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
