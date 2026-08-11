"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  MessageSquareWarning,
  UtensilsCrossed,
  Megaphone,
  Wallet,
  Clock,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/stores/org-store";
import { supportsFoodMenu } from "@/lib/food-menu/org-support";

interface ResidentBottomNavProps {
  orgSlug: string;
}

export function ResidentBottomNav({ orgSlug }: ResidentBottomNavProps) {
  const pathname = usePathname();
  const org = useOrgStore((s) => s.activeOrg);
  const showFoodMenu = supportsFoodMenu(org?.organizationType);
  const isCommunity = org?.organizationType === "GATED_COMMUNITY";

  const hostelItems = [
    { href: `/app/${orgSlug}/resident`, label: "Home", icon: Home, exact: true },
    ...(showFoodMenu ? [{ href: `/app/${orgSlug}/resident#menu`, label: "Menu", icon: UtensilsCrossed, exact: false }] : []),
    { href: `/app/${orgSlug}/resident/payments`, label: "Payments", icon: Wallet, exact: false },
    { href: `/app/${orgSlug}/resident/complaints`, label: "Complaints", icon: MessageSquareWarning, exact: false },
    { href: `/app/${orgSlug}/resident/accommodation`, label: "Layout", icon: LayoutGrid, exact: false },
  ];

  const communityItems = [
    { href: `/app/${orgSlug}/resident`, label: "Home", icon: Home, exact: true },
    { href: `/app/${orgSlug}/resident/announcements`, label: "Announcements", icon: Megaphone, exact: false },
    { href: `/app/${orgSlug}/resident/payments`, label: "Payments", icon: Wallet, exact: false },
    { href: `/app/${orgSlug}/resident/complaints`, label: "Complaints", icon: MessageSquareWarning, exact: false },
  ];

  const items = isCommunity ? communityItems : hostelItems;
  // Ensure we only show up to 5 items to keep it clean on mobile
  const displayItems = items.slice(0, 5);

  function isActive(path: string, exact: boolean) {
    if (path.endsWith("#menu")) {
      return pathname === `/app/${orgSlug}/resident`;
    }
    return exact ? pathname === path : pathname.startsWith(path);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md md:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {displayItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);

          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
