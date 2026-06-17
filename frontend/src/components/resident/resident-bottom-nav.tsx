"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  MessageSquareWarning,
  MoreHorizontal,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ResidentBottomNavProps {
  orgSlug: string;
}

const primaryItems = [
  {
    href: (slug: string) => `/app/${slug}/resident`,
    label: "Home",
    icon: Home,
    exact: true as const,
  },
  {
    href: (slug: string) => `/app/${slug}/resident/accommodation`,
    label: "Layout",
    icon: LayoutGrid,
    exact: false as const,
  },
  {
    href: (slug: string) => `/app/${slug}/resident#menu`,
    label: "Menu",
    icon: UtensilsCrossed,
    exact: false as const,
  },
  {
    href: (slug: string) => `/app/${slug}/resident/complaints`,
    label: "Complaints",
    icon: MessageSquareWarning,
    exact: false as const,
  },
] as const;

const moreItems = (orgSlug: string) => [
  { href: `/app/${orgSlug}/resident/timeline`, label: "Timeline" },
  { href: `/app/${orgSlug}/resident/ledger`, label: "Ledger" },
  { href: `/app/${orgSlug}/resident/announcements`, label: "Announcements" },
  { href: `/app/${orgSlug}/resident/payments`, label: "Payments" },
  { href: `/app/${orgSlug}/resident/review`, label: "Leave a review" },
  { href: "/", label: "Explore site" },
  { href: "/app/profile", label: "Account" },
];

export function ResidentBottomNav({ orgSlug }: ResidentBottomNavProps) {
  const pathname = usePathname();

  function isActive(path: string, exact: boolean) {
    if (path.endsWith("#menu")) {
      return pathname === `/app/${orgSlug}/resident`;
    }
    return exact ? pathname === path : pathname.startsWith(path);
  }

  const moreActive = moreItems(orgSlug).some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md md:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {primaryItems.map(({ href, label, icon: Icon, exact }) => {
          const path = href(orgSlug);
          const active = isActive(path, exact);

          return (
            <Link
              key={label}
              href={path}
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

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className={cn(
                  "flex h-auto min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-none px-1 py-2 text-[10px] font-medium",
                  moreActive ? "text-primary" : "text-muted-foreground",
                )}
              />
            }
          >
            <MoreHorizontal className="size-5" />
            <span>More</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="mb-2 w-48">
            {moreItems(orgSlug).map((item) => (
              <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
