"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Clock,
  History,
  LayoutDashboard,
  Megaphone,
  Package,
  Radio,
  Settings,
  Star,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wallet,
  Wrench,
} from "lucide-react";
import { useOrganization } from "@/hooks/use-organization";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";
import { supportsFoodMenu } from "@/lib/food-menu/org-support";
import { canAccessOperations } from "@/lib/permissions/evaluate";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const navItems: Array<{
  href: string;
  suffix: string;
  label: string;
  icon: typeof LayoutDashboard;
  perm: (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | null;
  foodOnly?: boolean;
  gatedOnly?: boolean;
}> = [
  { href: "operations", suffix: "", label: "Dashboard", icon: LayoutDashboard, perm: PERMISSIONS.DASHBOARD_VIEW },
  { href: "operations/live", suffix: "live", label: "Live", icon: Radio, perm: null },
  { href: "operations/complaints", suffix: "complaints", label: "Complaints", icon: Wrench, perm: PERMISSIONS.COMPLAINT_READ },
  { href: "operations/join-requests", suffix: "join-requests", label: "Joins", icon: UserPlus, perm: PERMISSIONS.RESIDENT_APPROVE },
  { href: "operations/residents", suffix: "residents", label: "Residents", icon: Users, perm: PERMISSIONS.RESIDENT_MANAGE },
  { href: "operations/announcements", suffix: "announcements", label: "Announcements", icon: Megaphone, perm: PERMISSIONS.ANNOUNCEMENT_MANAGE },
  { href: "operations/accommodation", suffix: "accommodation", label: "Accommodation", icon: Building2, perm: PERMISSIONS.BUILDING_MANAGE },
  { href: "operations/payments", suffix: "payments", label: "Payments", icon: Wallet, perm: PERMISSIONS.PAYMENT_MANAGE },
  { href: "operations/ledger", suffix: "ledger", label: "Ledger", icon: BookOpen, perm: PERMISSIONS.PAYMENT_MANAGE },
  { href: "operations/defaulters", suffix: "defaulters", label: "Defaulters", icon: AlertTriangle, perm: PERMISSIONS.PAYMENT_MANAGE },
  { href: "operations/timeline", suffix: "timeline", label: "Timeline", icon: Clock, perm: PERMISSIONS.RESIDENT_MANAGE },
  { href: "operations/accommodation-history", suffix: "accommodation-history", label: "Stay history", icon: History, perm: PERMISSIONS.RESIDENT_MANAGE },
  { href: "operations/ownership", suffix: "ownership", label: "Ownership", icon: Building2, perm: PERMISSIONS.BUILDING_MANAGE, gatedOnly: true },
  { href: "operations/food-menu", suffix: "food-menu", label: "Menu", icon: UtensilsCrossed, perm: PERMISSIONS.ORGANIZATION_UPDATE, foodOnly: true },
  { href: "operations/assets", suffix: "assets", label: "Assets", icon: Package, perm: PERMISSIONS.BUILDING_MANAGE },
  { href: "operations/reviews", suffix: "reviews", label: "Reviews", icon: Star, perm: PERMISSIONS.DASHBOARD_VIEW },
  { href: "operations/staff", suffix: "staff", label: "Staff", icon: Users, perm: PERMISSIONS.STAFF_MANAGE },
  { href: "operations/settings", suffix: "settings", label: "Settings", icon: Settings, perm: PERMISSIONS.ORGANIZATION_UPDATE },
];

interface OperationsNavProps {
  orgSlug: string;
}

export function OperationsNav({ orgSlug }: OperationsNavProps) {
  const pathname = usePathname();
  const { can, isOwner, permissions, activeOrg } = usePermissions();
  const { data: org } = useOrganization(activeOrg?.id);
  const showFoodMenu = supportsFoodMenu(org?.type);

  if (!canAccessOperations(permissions, isOwner)) {
    return null;
  }

  const base = `/app/${orgSlug}`;

  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1">
      {navItems.map(({ href, suffix, label, icon: Icon, perm, foodOnly, gatedOnly }) => {
        if (foodOnly && !showFoodMenu) return null;
        if (gatedOnly && org?.type !== "GATED_COMMUNITY") return null;
        if (perm && !can(perm) && !isOwner) return null;
        const fullHref = `${base}/${href}`;
        const active =
          suffix === "" ? pathname === fullHref : pathname.startsWith(fullHref);
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
  );
}
