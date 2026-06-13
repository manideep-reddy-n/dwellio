"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { canAccessOperations } from "@/lib/permissions/evaluate";
import { Skeleton } from "@/components/ui/skeleton";

interface OpsGuardProps {
  children: React.ReactNode;
  permission?: string;
}

export function OpsGuard({ children, permission }: OpsGuardProps) {
  const router = useRouter();
  const { activeOrg, can, isOwner, permissions } = usePermissions();

  const hasAccess = permission
    ? can(permission) || isOwner
    : canAccessOperations(permissions, isOwner);

  useEffect(() => {
    if (activeOrg && !hasAccess) {
      router.replace(`/app/${activeOrg.slug}/resident`);
    }
  }, [activeOrg, hasAccess, router]);

  if (!activeOrg) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  if (!hasAccess) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  return <>{children}</>;
}
