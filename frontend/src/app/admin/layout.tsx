"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Building2, BadgeCheck, HeartPulse, Home, LayoutDashboard, LogOut } from "lucide-react";
import { PageTransition } from "@/components/shared/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { siteConfig } from "@/config/site";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/verification-requests", label: "Verification", icon: BadgeCheck },
  { href: "/admin/health", label: "System health", icon: HeartPulse },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, ready, isAuthenticated, logout, touchActivity } = useAdminAuth();

  const isLoginPage = pathname === "/admin/login";

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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/overview" className="font-semibold">
              {siteConfig.name} Admin
            </Link>
            <nav className="hidden gap-1 sm:flex">
              {adminNav.map(({ href, label, icon: Icon }) => (
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
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">{session?.userName}</span>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
            >
              <Home className="size-4" />
              Home
            </Link>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => logout()}>
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
