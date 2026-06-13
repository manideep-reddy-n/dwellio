"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  Radio,
  Search,
} from "lucide-react";
import { CommandPalette } from "@/components/layout/command-palette";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadNotificationCount } from "@/hooks/use-unread-notifications";
import { useOrgStore } from "@/stores/org-store";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const activeOrg = useOrgStore((s) => s.activeOrg);
  const unreadCount = useUnreadNotificationCount();
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette);
  const isPlatformAdmin = user?.platformAdmin;

  const orgSlug = activeOrg?.slug;
  const liveHref = orgSlug ? `/app/${orgSlug}/operations/live` : "/app/organizations";

  const navItems = orgSlug
    ? [
        { href: liveHref, label: "Live", icon: Radio },
        { href: `/app/${orgSlug}/operations`, label: "Operations", icon: LayoutDashboard },
      ]
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <CommandPalette />
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/app" className="shrink-0 font-semibold">
              {siteConfig.name}
            </Link>
            <OrgSwitcher />
          </div>

          <nav className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-2 text-muted-foreground sm:inline-flex"
              onClick={toggleCommandPalette}
            >
              <Search className="size-3.5" />
              <span className="text-xs">Ctrl K</span>
            </Button>
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  buttonVariants({
                    variant: pathname.startsWith(href) ? "secondary" : "ghost",
                    size: "sm",
                  }),
                  "gap-1.5",
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
            <Link
              href="/app/notifications"
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "relative")}
              title="Notifications"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 size-4 justify-center p-0 text-[10px]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Link>
            {isPlatformAdmin && (
              <Link
                href="/admin"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}
              >
                Admin
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              {user?.fullName?.split(" ")[0] ?? "Account"}
            </Button>
          </nav>
        </div>
      </header>
      <main className={cn("mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6")}>{children}</main>
    </div>
  );
}
