"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, Home, Menu, Radio, Search } from "lucide-react";
import { AccountMenu } from "@/components/layout/account-menu";
import { CommandPalette } from "@/components/layout/command-palette";
import { NotificationBell } from "@/components/layout/notification-bell";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const router = useRouter();
  const { activeOrg, permissions, isOwner } = usePermissions();
  const { data: memberships = [] } = useMyMemberships();
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette);

  const orgSlug = activeOrg?.slug;
  const homeHref = resolveAppHome(memberships);
  const residentOnly = isResidentOnlyUser(memberships);
  const navItems = orgSlug ? activeOrgNav(orgSlug, permissions, isOwner) : [];
  const hasOrgHomeNav = navItems.some((item) => item.label === "Home");
  const isResidentRoute = Boolean(orgSlug && pathname.startsWith(`/app/${orgSlug}/resident`));

  return (
    <div className="flex min-h-screen flex-col">
      <CommandPalette />
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-none sm:gap-3">
            <Link href={homeHref} className="shrink-0 font-semibold">
              {siteConfig.name}
            </Link>
            <div className="min-w-0 flex-1 sm:flex-none">
              <OrgSwitcher />
            </div>
          </div>

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

            {(navItems.length > 0 || !hasOrgHomeNav) && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "md:hidden")}
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {!hasOrgHomeNav && (
                    <DropdownMenuItem onClick={() => router.push("/")}>
                      Marketing home
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => router.push("/explore")}>
                    Explore
                  </DropdownMenuItem>
                  {residentOnly && memberships[0] && (
                    <DropdownMenuItem onClick={() => router.push(orgHomePath(memberships[0]))}>
                      My stay
                    </DropdownMenuItem>
                  )}
                  {navItems.length > 0 && <DropdownMenuSeparator />}
                  {navItems.map(({ href, label }) => (
                    <DropdownMenuItem key={href} onClick={() => router.push(href)}>
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

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
