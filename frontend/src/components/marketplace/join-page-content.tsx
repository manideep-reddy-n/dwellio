"use client";

import Link from "next/link";
import { MemberJoinBanner } from "@/components/marketplace/member-join-banner";
import { JoinRequestForm } from "@/components/marketplace/join-request-form";
import { useMyMemberships } from "@/hooks/use-memberships";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface JoinPageContentProps {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
}

export function JoinPageContent({
  organizationId,
  organizationSlug,
  organizationName,
}: JoinPageContentProps) {
  const { data: memberships = [] } = useMyMemberships();
  const isMember = memberships.some((m) => m.organizationId === organizationId);

  return (
    <>
      <Link
        href={`/${organizationSlug}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4 inline-flex")}
      >
        ← Back to profile
      </Link>

      {isMember ? (
        <MemberJoinBanner
          organizationId={organizationId}
          organizationSlug={organizationSlug}
          organizationName={organizationName}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Request to join {organizationName}</CardTitle>
            <CardDescription>
              Submit a join request. The property team will review and notify you when approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JoinRequestForm
              organizationId={organizationId}
              organizationName={organizationName}
              slug={organizationSlug}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
