"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Megaphone,
  MessageSquare,
  Wallet,
  LayoutDashboard,
  Radio,
  UserPlus,
  Users,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useMyMemberships } from "@/hooks/use-memberships";
import { canAccessOperations } from "@/lib/permissions/evaluate";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { activeOrg, permissions, isOwner } = usePermissions();
  const { data: memberships = [] } = useMyMemberships();
  const orgSlug = activeOrg?.slug;

  // Only render when inside an org route
  const isInOrgRoute = Boolean(
    orgSlug &&
      (pathname.startsWith(`/app/${orgSlug}/operations`) ||
        pathname.startsWith(`/app/${orgSlug}/resident`)),
  );

  if (!isInOrgRoute || !orgSlug) return null;

  const hasOpsAccess = canAccessOperations(permissions, isOwner);

  // Resident bottom nav: Home | Announcements | Payments | Complaints
  const residentItems = [
    {
      href: `/app/${orgSlug}/resident`,
      label: "Home",
      icon: Home,
      exact: true,
    },
    {
      href: `/app/${orgSlug}/resident/announcements`,
      label: "Notices",
      icon: Megaphone,
      exact: false,
    },
    {
      href: `/app/${orgSlug}/resident/payments`,
      label: "Payments",
      icon: Wallet,
      exact: false,
    },
    {
      href: `/app/${orgSlug}/resident/complaints`,
      label: "Complaints",
      icon: MessageSquare,
      exact: false,
    },
  ];

  // Owner bottom nav: Dashboard | Live | Join Requests | Residents
  const ownerItems = [
    {
      href: `/app/${orgSlug}/operations`,
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: `/app/${orgSlug}/operations/live`,
      label: "Live",
      icon: Radio,
      exact: false,
    },
    {
      href: `/app/${orgSlug}/operations/join-requests`,
      label: "Joins",
      icon: UserPlus,
      exact: false,
    },
    {
      href: `/app/${orgSlug}/operations/residents`,
      label: "Residents",
      icon: Users,
      exact: false,
    },
  ];

  const items = hasOpsAccess ? ownerItems : residentItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t bg-background/95 backdrop-blur-md md:hidden">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              active
                ? "text-teal-600 dark:text-teal-400"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-5 shrink-0",
                active ? "text-teal-600 dark:text-teal-400" : "",
              )}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
