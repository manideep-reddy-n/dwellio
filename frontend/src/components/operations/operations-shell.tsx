"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Megaphone,
  Package,
  Radio,
  Settings,
  Star,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";
import { canAccessOperations } from "@/lib/permissions/evaluate";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const navItems = [
  { href: "operations", suffix: "", label: "Dashboard", icon: LayoutDashboard, perm: PERMISSIONS.DASHBOARD_VIEW },
  { href: "operations/live", suffix: "live", label: "Live", icon: Radio, perm: null },
  { href: "operations/complaints", suffix: "complaints", label: "Complaints", icon: Wrench, perm: PERMISSIONS.COMPLAINT_READ },
  { href: "operations/join-requests", suffix: "join-requests", label: "Joins", icon: UserPlus, perm: PERMISSIONS.RESIDENT_APPROVE },
  { href: "operations/residents", suffix: "residents", label: "Residents", icon: Users, perm: PERMISSIONS.RESIDENT_MANAGE },
  { href: "operations/announcements", suffix: "announcements", label: "Announcements", icon: Megaphone, perm: PERMISSIONS.ANNOUNCEMENT_MANAGE },
  { href: "operations/accommodation", suffix: "accommodation", label: "Accommodation", icon: Building2, perm: PERMISSIONS.BUILDING_MANAGE },
  { href: "operations/assets", suffix: "assets", label: "Assets", icon: Package, perm: PERMISSIONS.BUILDING_MANAGE },
  { href: "operations/reviews", suffix: "reviews", label: "Reviews", icon: Star, perm: PERMISSIONS.DASHBOARD_VIEW },
  { href: "operations/staff", suffix: "staff", label: "Staff", icon: Users, perm: PERMISSIONS.STAFF_MANAGE },
  { href: "operations/settings", suffix: "settings", label: "Settings", icon: Settings, perm: PERMISSIONS.ORGANIZATION_UPDATE },
] as const;

interface OperationsShellProps {
  orgSlug: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function OperationsShell({
  orgSlug,
  title,
  description,
  children,
  actions,
}: OperationsShellProps) {
  const pathname = usePathname();
  const { can, isOwner, permissions } = usePermissions();

  if (!canAccessOperations(permissions, isOwner)) {
    return null;
  }

  const base = `/app/${orgSlug}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>

      <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        {navItems.map(({ href, suffix, label, icon: Icon, perm }) => {
          if (perm && !can(perm) && !isOwner) return null;
          const fullHref = `${base}/${href}`;
          const active =
            suffix === ""
              ? pathname === fullHref
              : pathname.startsWith(fullHref);
          return (
            <Link
              key={href}
              href={fullHref}
              className={cn(
                buttonVariants({ variant: active ? "secondary" : "ghost", size: "sm" }),
                "shrink-0 gap-1.5",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
