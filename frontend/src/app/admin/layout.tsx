"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Building2, HeartPulse, LayoutDashboard } from "lucide-react";
import { AuthGate } from "@/components/providers/auth-gate";
import { PageTransition } from "@/components/shared/page-transition";
import { useAuth } from "@/hooks/use-auth";
import { siteConfig } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/health", label: "System health", icon: HeartPulse },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, sessionReady } = useAuth();

  useEffect(() => {
    if (sessionReady && !user?.platformAdmin) {
      router.replace("/app");
    }
  }, [user, sessionReady, router]);

  if (!sessionReady || !user?.platformAdmin) {
    return null;
  }

  return (
    <AuthGate>
      <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-semibold">
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
          <Link href="/app" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Back to app
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
    </AuthGate>
  );
}
