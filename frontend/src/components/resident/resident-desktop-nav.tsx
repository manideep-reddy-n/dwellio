"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Clock,
  Home,
  LayoutGrid,
  MessageSquare,
  Megaphone,
  Star,
  Wallet,
} from "lucide-react";
import { useMyComplaints } from "@/hooks/use-complaints";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";

interface ResidentDesktopNavProps {
  orgSlug: string;
}

const items = (orgSlug: string) =>
  [
    { href: `/app/${orgSlug}/resident`, label: "Home", icon: Home, exact: true },
    {
      href: `/app/${orgSlug}/resident/accommodation`,
      label: "Building layout",
      icon: LayoutGrid,
      exact: false,
    },
    { href: `/app/${orgSlug}/resident/timeline`, label: "Timeline", icon: Clock, exact: false },
    { href: `/app/${orgSlug}/resident/ledger`, label: "Ledger", icon: BookOpen, exact: false },
    { href: `/app/${orgSlug}/resident/payments`, label: "Payments", icon: Wallet, exact: false },
    {
      href: `/app/${orgSlug}/resident/complaints`,
      label: "Complaints",
      icon: MessageSquare,
      exact: false,
      badgeKey: "complaints" as const,
    },
    {
      href: `/app/${orgSlug}/resident/announcements`,
      label: "Announcements",
      icon: Megaphone,
      exact: false,
    },
    { href: `/app/${orgSlug}/resident/review`, label: "My review", icon: Star, exact: false },
  ] as const;

export function ResidentDesktopNav({ orgSlug }: ResidentDesktopNavProps) {
  const pathname = usePathname();
  const { activeOrg } = usePermissions();
  const { data: complaints } = useMyComplaints(activeOrg?.id);
  const openComplaints =
    complaints?.filter((c) => !["RESOLVED", "CLOSED"].includes(c.status)).length ?? 0;

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="mb-6 hidden border-b md:block">
      <div className="-mb-px flex flex-wrap gap-1">
        {items(orgSlug).map((item) => {
          const { href, label, icon: Icon, exact } = item;
          const badge =
            "badgeKey" in item && item.badgeKey === "complaints" && openComplaints > 0
              ? openComplaints
              : 0;

          return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              isActive(href, exact)
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
            {badge > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {badge}
              </span>
            )}
          </Link>
          );
        })}
      </div>
    </nav>
  );
}
