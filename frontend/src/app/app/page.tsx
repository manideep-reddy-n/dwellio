"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageTransition } from "@/components/shared/page-transition";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { useMyMemberships } from "@/hooks/use-memberships";
import {
  canCreateOrganization,
  isResidentOnlyUser,
  resolveAppHome,
} from "@/lib/navigation/app-routing";
import { cn } from "@/lib/utils";

export default function AppHomePage() {
  const router = useRouter();
  const { authReady } = useAuthReady();
  const { data: memberships, isLoading } = useMyMemberships();

  useEffect(() => {
    if (!authReady || isLoading || !memberships) return;

    if (memberships.length === 1) {
      router.replace(resolveAppHome(memberships));
    }
  }, [authReady, isLoading, memberships, router]);

  if (!authReady || isLoading) {
    return (
      <PageTransition>
        <Skeleton className="mx-auto h-48 max-w-lg rounded-xl" />
      </PageTransition>
    );
  }

  const list = memberships ?? [];
  const residentOnly = isResidentOnlyUser(list);
  const showCreate = canCreateOrganization(list);

  if (list.length === 1) {
    return (
      <PageTransition>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Opening your dashboard…
        </div>
      </PageTransition>
    );
  }

  if (list.length === 0) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle>Manage your properties</CardTitle>
              <CardDescription>
                Create an organization to manage residents, complaints, and accommodation — or explore
                verified stays to join as a resident.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Link href="/app/organizations/new" className={cn(buttonVariants())}>
                Create organization
              </Link>
              <Link href="/explore" className={cn(buttonVariants({ variant: "outline" }))}>
                Explore stays
              </Link>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>{residentOnly ? "Your stays" : "Choose organization"}</CardTitle>
            <CardDescription>
              {residentOnly
                ? "Switch between properties where you have an active membership."
                : "Select which property you want to manage."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/app/organizations" className={cn(buttonVariants())}>
              {residentOnly ? "View my stays" : "My organizations"}
            </Link>
            {showCreate && (
              <Link
                href="/app/organizations/new"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Create organization
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
