"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Compass, Home, Menu, Radio, Search } from "lucide-react";
import { AccountMenu } from "@/components/layout/account-menu";
import { CommandPalette } from "@/components/layout/command-palette";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { useMyMemberships } from "@/hooks/use-memberships";
import { usePermissions } from "@/hooks/use-permissions";
import {
  activeOrgNav,
  isResidentOnlyUser,
  orgHomePath,
  resolveAppHome,
} from "@/lib/navigation/app-routing";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

const navIcons = {
  Live: Radio,
  Home: Home,
} as const;

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { activeOrg, permissions, isOwner } = usePermissions();
  const { data: memberships = [] } = useMyMemberships();
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const orgSlug = activeOrg?.slug;
  const homeHref = resolveAppHome(memberships);
  const residentOnly = isResidentOnlyUser(memberships);
  const navItems = orgSlug ? activeOrgNav(orgSlug, permissions, isOwner) : [];
  const hasOrgHomeNav = navItems.some((item) => item.label === "Home");
  const isResidentRoute = Boolean(orgSlug && pathname.startsWith(`/app/${orgSlug}/resident`));

  return (
    <div className="flex min-h-screen flex-col">
      <CommandPalette />

      {/* Mobile sidebar */}
      <MobileSidebar open={sidebarOpen} onClose={closeSidebar} />

      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-none sm:gap-3">
            {/* Mobile hamburger → opens sidebar */}
            <button
              type="button"
              aria-label="Open navigation menu"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "shrink-0 md:hidden",
              )}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="size-5" />
            </button>

            <Link href={homeHref} className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
              <Image
                src="/dwellio-logo.webp"
                alt="Dwellio Logo"
                width={24}
                height={24}
                className="size-6 object-contain rounded-md"
              />
              <span>{siteConfig.name}</span>
            </Link>
            <div className="min-w-0 flex-1 sm:flex-none">
              <OrgSwitcher />
            </div>
          </div>

          {/* Desktop nav — unchanged */}
          <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <div className="hidden items-center gap-1 md:flex">
              {!hasOrgHomeNav && (
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ variant: pathname === "/" ? "secondary" : "ghost", size: "sm" }),
                    "gap-1.5",
                  )}
                >
                  <Home className="size-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
              )}
              <Link
                href="/explore"
                className={cn(
                  buttonVariants({
                    variant: pathname.startsWith("/explore") ? "secondary" : "ghost",
                    size: "sm",
                  }),
                  "gap-1.5",
                )}
              >
                <Compass className="size-4" />
                <span className="hidden sm:inline">Explore</span>
              </Link>
              {residentOnly && memberships[0] && (
                <Link
                  href={orgHomePath(memberships[0])}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  My stay
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                className="hidden gap-2 text-muted-foreground lg:inline-flex"
                onClick={toggleCommandPalette}
              >
                <Search className="size-3.5" />
                <span className="text-xs">Ctrl K</span>
              </Button>
              {navItems.map(({ href, label }) => {
                const Icon = navIcons[label as keyof typeof navIcons] ?? Home;
                return (
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
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>

            <NotificationBell />
            <AccountMenu />
          </nav>
        </div>
      </header>
      <main
        className={cn(
          "mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-6",
          isResidentRoute && "pb-20 md:pb-6",
        )}
      >
        {children}
      </main>
    </div>
  );
}
