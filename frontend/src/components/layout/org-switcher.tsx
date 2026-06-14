"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Compass } from "lucide-react";
import { OrganizationLogo } from "@/components/shared/organization-logo";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMyMemberships } from "@/hooks/use-memberships";
import { membershipToOrgContext } from "@/lib/org/context";
import {
  canCreateOrganization,
  isResidentOnlyUser,
  orgHomePath,
} from "@/lib/navigation/app-routing";
import { useOrgStore } from "@/stores/org-store";
import { cn } from "@/lib/utils";

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
      <Link
        href="/app/organizations"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
      >
        <Compass className="size-4" />
        My organizations
      </Link>
    );
  }

  const residentOnly = isResidentOnlyUser(memberships);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "w-full max-w-[7.5rem] justify-between gap-1.5 sm:max-w-[220px] sm:gap-2",
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <OrganizationLogo
            name={activeOrg?.name ?? "Property"}
            logoUrl={activeOrg?.logoUrl}
            size="xs"
          />
          <span className="truncate">{activeOrg?.name ?? "Select property"}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{residentOnly ? "My stays" : "Organizations"}</DropdownMenuLabel>
          {memberships.map((membership) => (
            <DropdownMenuItem
              key={membership.organizationId}
              onClick={() => {
                setActiveOrg(membershipToOrgContext(membership));
                router.push(orgHomePath(membership));
              }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <OrganizationLogo
                  name={membership.organizationName}
                  logoUrl={membership.logoUrl}
                  size="xs"
                />
                <span className="truncate">{membership.organizationName}</span>
              </span>
              {activeOrg?.id === membership.organizationId && (
                <span className="ml-auto text-xs text-muted-foreground">Active</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {memberships.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/app/organizations")}>
              {residentOnly ? "All my stays" : "All organizations"}
            </DropdownMenuItem>
          </>
        )}
        {canCreateOrganization(memberships) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/app/organizations/new")}>
              Create organization
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
