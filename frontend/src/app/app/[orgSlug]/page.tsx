"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { canAccessOperations } from "@/lib/permissions/evaluate";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrgHubRedirect() {
  const router = useRouter();
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params.orgSlug;
  const { activeOrg, permissions, isOwner } = usePermissions();

  useEffect(() => {
    if (!orgSlug) return;
    if (activeOrg && activeOrg.slug !== orgSlug) return;

    if (canAccessOperations(permissions, isOwner)) {
      router.replace(`/app/${orgSlug}/operations/live`);
    } else {
      router.replace(`/app/${orgSlug}/resident`);
    }
  }, [activeOrg, orgSlug, permissions, isOwner, router]);

  return <Skeleton className="mx-auto mt-12 h-32 max-w-7xl rounded-xl" />;
}
