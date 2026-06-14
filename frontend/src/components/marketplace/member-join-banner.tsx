"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMyMemberships } from "@/hooks/use-memberships";
import { orgHomePath } from "@/lib/navigation/app-routing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MemberJoinBannerProps {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
}

/** Hides join UI when the user is already a member of this property. */
export function MemberJoinBanner({
  organizationId,
  organizationSlug,
  organizationName,
}: MemberJoinBannerProps) {
  const router = useRouter();
  const { data: memberships = [] } = useMyMemberships();
  const membership = memberships.find((m) => m.organizationId === organizationId);

  if (!membership) return null;

  return (
    <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50/80 p-4 dark:border-teal-900 dark:bg-teal-950/30">
      <p className="text-sm font-medium">You are already a member of {organizationName}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Go to your stay dashboard or manage membership in account settings.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={orgHomePath(membership)} className={cn(buttonVariants({ size: "sm" }))}>
          Open my stay
        </Link>
        <Link href="/app/profile" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Account settings
        </Link>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          onClick={() => router.push("/explore")}
        >
          Explore other stays
        </button>
      </div>
    </div>
  );
}
