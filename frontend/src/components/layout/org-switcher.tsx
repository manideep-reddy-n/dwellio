"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMyMemberships } from "@/hooks/use-memberships";
import { membershipToOrgContext } from "@/lib/org/context";
import { canAccessOperations } from "@/lib/permissions/evaluate";
import { useOrgStore } from "@/stores/org-store";
import { cn } from "@/lib/utils";

function defaultOrgPath(slug: string, permissions: string[], isOwner: boolean): string {
  return canAccessOperations(permissions, isOwner)
    ? `/app/${slug}/operations/live`
    : `/app/${slug}/resident`;
}

export function OrgSwitcher() {
  const router = useRouter();
  const activeOrg = useOrgStore((s) => s.activeOrg);
  const setActiveOrg = useOrgStore((s) => s.setActiveOrg);
  const { data: memberships = [], isLoading } = useMyMemberships();

  if (isLoading) {
    return <span className="text-sm text-muted-foreground">Loading…</span>;
  }

  if (memberships.length === 0) {
    return (
      <Link href="/app/organizations/new" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
        <Plus className="size-4" />
        Create org
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "max-w-[200px] justify-between gap-2",
        )}
      >
        <span className="truncate">{activeOrg?.name ?? "Select organization"}</span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.organizationId}
            onClick={() => {
              setActiveOrg(membershipToOrgContext(membership));
              router.push(
                defaultOrgPath(
                  membership.organizationSlug,
                  membership.permissions,
                  membership.ownerRole,
                ),
              );
            }}
          >
            <span className="truncate">{membership.organizationName}</span>
            {activeOrg?.id === membership.organizationId && (
              <span className="ml-auto text-xs text-muted-foreground">Active</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/app/organizations")}>
          All organizations
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
