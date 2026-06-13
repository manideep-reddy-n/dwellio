"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Megaphone, MessageSquareWarning, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResidentBottomNavProps {
  orgSlug: string;
}

const navItems = [
  { href: (slug: string) => `/app/${slug}/resident`, label: "Home", icon: Home, exact: true as const },
  {
    href: (slug: string) => `/app/${slug}/resident/complaints`,
    label: "Complaints",
    icon: MessageSquareWarning,
    exact: false as const,
  },
  {
    href: (slug: string) => `/app/${slug}/resident/announcements`,
    label: "News",
    icon: Megaphone,
    exact: false as const,
  },
  {
    href: (slug: string) => `/app/${slug}/resident/review`,
    label: "Review",
    icon: Star,
    exact: false as const,
  },
];

export function ResidentBottomNav({ orgSlug }: ResidentBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md md:hidden">
      <div className="mx-auto flex h-14 max-w-lg items-stretch justify-around px-2">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const path = href(orgSlug);
          const active = exact ? pathname === path : pathname.startsWith(path);

          return (
            <Link
              key={path}
              href={path}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
