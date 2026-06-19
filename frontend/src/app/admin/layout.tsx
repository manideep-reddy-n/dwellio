"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Building2,
  ClipboardList,
  HeartPulse,
  Home,
  LogOut,
  Radar,
  Search,
  Settings,
} from "lucide-react";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";
import { PageTransition } from "@/components/shared/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAuth, ensureAdminSession } from "@/hooks/use-admin-auth";
import { siteConfig } from "@/config/site";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/admin/overview", label: "Mission Control", icon: Radar },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/verification-requests", label: "Verification", icon: BadgeCheck },
  { href: "/admin/configuration", label: "Configuration", icon: Settings },
];

const governanceNav = [
  { href: "/admin/audit-logs", label: "Audit logs", icon: ClipboardList },
  { href: "/admin/notifications", label: "Notifications", icon: ClipboardList },
  { href: "/admin/health", label: "System health", icon: HeartPulse },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, ready, isAuthenticated, logout, touchActivity } = useAdminAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    void ensureAdminSession();
  }, [isLoginPage]);

  useEffect(() => {
    if (!ready) return;
    if (isLoginPage && isAuthenticated) {
      router.replace("/admin/overview");
      return;
    }
    if (!isLoginPage && !isAuthenticated) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [ready, isAuthenticated, isLoginPage, pathname, router]);

  useEffect(() => {
    if (!isLoginPage) touchActivity();
  }, [pathname, isLoginPage, touchActivity]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    if (!isLoginPage) {
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }
  }, [isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!ready || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  const navLink = (href: string, label: string, Icon: React.ComponentType<{ className?: string }>) => (
    <Link
      key={href}
      href={href}
      className={cn(
        buttonVariants({
          variant: pathname.startsWith(href) ? "secondary" : "ghost",
          size: "sm",
        }),
        "gap-1.5 shrink-0",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-muted/30 to-background">
      <AdminCommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/admin/overview" className="shrink-0 font-semibold tracking-tight">
              {siteConfig.name} <span className="text-teal-600">Ops</span>
            </Link>
            <nav className="hidden gap-1 lg:flex">
              {primaryNav.map(({ href, label, icon }) => navLink(href, label, icon))}
              <span className="mx-1 w-px self-center bg-border" />
              {governanceNav.map(({ href, label, icon }) => navLink(href, label, icon))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded border bg-muted px-1.5 text-[10px] font-medium sm:inline">
                ⌘K
              </kbd>
            </Button>
            <span className="hidden text-xs text-muted-foreground md:inline">{session?.userName}</span>
            <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}>
              <Home className="size-4" />
            </Link>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => logout()}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t px-4 py-2 lg:hidden">
          {[...primaryNav, ...governanceNav].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                buttonVariants({
                  variant: pathname.startsWith(href) ? "secondary" : "ghost",
                  size: "xs",
                }),
                "shrink-0",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-6 sm:px-6">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
