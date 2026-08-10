"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Clock,
  Compass,
  History,
  Home,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Package,
  Radio,
  Settings,
  Star,
  UserPlus,
  UserRound,
  Users,
  UtensilsCrossed,
  Wallet,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMyMemberships } from "@/hooks/use-memberships";
import { useOrganization } from "@/hooks/use-organization";
import { usePermissions } from "@/hooks/use-permissions";
import { supportsFoodMenu } from "@/lib/food-menu/org-support";
import {
  isResidentOnlyUser,
  orgHomePath,
  resolveAppHome,
} from "@/lib/navigation/app-routing";
import { PERMISSIONS } from "@/lib/permissions/codes";
import { canAccessOperations } from "@/lib/permissions/evaluate";
import { cn } from "@/lib/utils";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { activeOrg, permissions, isOwner, can } = usePermissions();
  const { data: org } = useOrganization(activeOrg?.id);
  const { data: memberships = [] } = useMyMemberships();

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const orgSlug = activeOrg?.slug;
  const homeHref = resolveAppHome(memberships);
  const residentOnly = isResidentOnlyUser(memberships);
  const hasOpsAccess = canAccessOperations(permissions, isOwner);
  const showFoodMenu = supportsFoodMenu(org?.type);

  // Close only when pathname actually changes
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      onCloseRef.current();
    }
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isInOrgRoute = Boolean(
    orgSlug &&
      (pathname.startsWith(`/app/${orgSlug}/operations`) ||
        pathname.startsWith(`/app/${orgSlug}/resident`)),
  );

  // Build Operations Navigation links if user has ops access and is inside an org route
  const opsNavItems =
    isInOrgRoute && hasOpsAccess
      ? [
          {
            group: "Management",
            items: [
              { href: `/app/${orgSlug}/operations`, label: "Dashboard", icon: LayoutDashboard, perm: PERMISSIONS.DASHBOARD_VIEW, exact: true },
              { href: `/app/${orgSlug}/operations/live`, label: "Live Ops", icon: Radio, perm: null },
              { href: `/app/${orgSlug}/operations/complaints`, label: "Complaints", icon: Wrench, perm: PERMISSIONS.COMPLAINT_READ },
              { href: `/app/${orgSlug}/operations/join-requests`, label: "Joins", icon: UserPlus, perm: PERMISSIONS.RESIDENT_APPROVE },
              { href: `/app/${orgSlug}/operations/residents`, label: "Residents", icon: Users, perm: PERMISSIONS.RESIDENT_MANAGE },
              { href: `/app/${orgSlug}/operations/announcements`, label: "Announcements", icon: Megaphone, perm: PERMISSIONS.ANNOUNCEMENT_MANAGE },
            ],
          },
          {
            group: "Financials",
            items: [
              { href: `/app/${orgSlug}/operations/payments`, label: "Payments", icon: Wallet, perm: PERMISSIONS.PAYMENT_MANAGE },
              { href: `/app/${orgSlug}/operations/ledger`, label: "Ledger", icon: BookOpen, perm: PERMISSIONS.PAYMENT_MANAGE },
              { href: `/app/${orgSlug}/operations/defaulters`, label: "Defaulters", icon: AlertTriangle, perm: PERMISSIONS.PAYMENT_MANAGE },
            ],
          },
          {
            group: "Property & Admin",
            items: [
              { href: `/app/${orgSlug}/operations/accommodation`, label: "Accommodation", icon: Building2, perm: PERMISSIONS.BUILDING_MANAGE },
              { href: `/app/${orgSlug}/operations/timeline`, label: "Timeline", icon: Clock, perm: PERMISSIONS.RESIDENT_MANAGE },
              { href: `/app/${orgSlug}/operations/accommodation-history`, label: "Stay history", icon: History, perm: PERMISSIONS.RESIDENT_MANAGE },
              { href: `/app/${orgSlug}/operations/ownership`, label: "Ownership", icon: Building2, perm: PERMISSIONS.BUILDING_MANAGE, gatedOnly: true },
              { href: `/app/${orgSlug}/operations/food-menu`, label: "Menu", icon: UtensilsCrossed, perm: PERMISSIONS.ORGANIZATION_UPDATE, foodOnly: true },
              { href: `/app/${orgSlug}/operations/assets`, label: "Assets", icon: Package, perm: PERMISSIONS.BUILDING_MANAGE },
              { href: `/app/${orgSlug}/operations/reviews`, label: "Reviews", icon: Star, perm: PERMISSIONS.DASHBOARD_VIEW },
              { href: `/app/${orgSlug}/operations/staff`, label: "Staff", icon: Users, perm: PERMISSIONS.STAFF_MANAGE },
              { href: `/app/${orgSlug}/operations/settings`, label: "Settings", icon: Settings, perm: PERMISSIONS.ORGANIZATION_UPDATE },
            ],
          },
        ]
      : [];

  // Build Resident Navigation links if resident and inside an org route
  const residentNavItems =
    isInOrgRoute && !hasOpsAccess
      ? [
          { href: `/app/${orgSlug}/resident`, label: "Home", icon: Home, exact: true },
          { href: `/app/${orgSlug}/resident/accommodation`, label: "Building layout", icon: LayoutGrid },
          { href: `/app/${orgSlug}/resident/timeline`, label: "Timeline", icon: Clock },
          { href: `/app/${orgSlug}/resident/ledger`, label: "Ledger", icon: BookOpen },
          { href: `/app/${orgSlug}/resident/payments`, label: "Payments", icon: Wallet },
          { href: `/app/${orgSlug}/resident/complaints`, label: "Complaints", icon: MessageSquare },
          { href: `/app/${orgSlug}/resident/announcements`, label: "Announcements", icon: Megaphone },
          { href: `/app/${orgSlug}/resident/review`, label: "My review", icon: Star },
        ]
      : [];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            onClick={() => onCloseRef.current()}
          />

          {/* Sidebar panel */}
          <motion.aside
            key="sidebar-panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-background shadow-2xl md:hidden transform-gpu will-change-transform"
          >
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b px-4">
              <Link href={homeHref} className="flex items-center gap-2 font-semibold tracking-tight">
                <Image
                  src="/dwellio-logo.webp"
                  alt="Dwellio Logo"
                  width={24}
                  height={24}
                  className="size-6 object-contain rounded-md"
                />
                <span>Dwellio</span>
              </Link>
              <button
                type="button"
                onClick={() => onCloseRef.current()}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close menu"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* User info */}
            {user && (
              <div className="border-b px-4 py-3">
                <p className="text-sm font-medium truncate">{user.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-3">
              {/* General Navigation */}
              <div className="px-3 pb-1">
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Navigation
                </p>
                <SidebarLink
                  href="/"
                  icon={Home}
                  label="Marketing home"
                  active={pathname === "/"}
                />
                <SidebarLink
                  href="/explore"
                  icon={Compass}
                  label="Explore stays"
                  active={pathname.startsWith("/explore")}
                />
                {residentOnly && memberships[0] && (
                  <SidebarLink
                    href={orgHomePath(memberships[0])}
                    icon={Home}
                    label="My stay"
                    active={pathname.startsWith(orgHomePath(memberships[0]))}
                  />
                )}
              </div>

              {/* Organization Operations Sub-menu */}
              {opsNavItems.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  <div className="px-5 pb-1">
                    <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 truncate">
                      {activeOrg?.name ?? "Organization Operations"}
                    </p>
                  </div>
                  {opsNavItems.map((group) => (
                    <div key={group.group} className="mt-2 px-3">
                      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.group}
                      </p>
                      {group.items.map((item) => {
                        const { href, label, icon: Icon, perm, foodOnly, gatedOnly, exact } = item as any;
                        if (foodOnly && !showFoodMenu) return null;
                        if (gatedOnly && org?.type !== "GATED_COMMUNITY") return null;
                        if (perm && !can(perm) && !isOwner) return null;
                        const active = exact ? pathname === href : pathname.startsWith(href);

                        return (
                          <SidebarLink
                            key={href}
                            href={href}
                            icon={Icon}
                            label={label}
                            active={active}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* Resident Organization Sub-menu */}
              {residentNavItems.length > 0 && (
                <div className="mt-3 border-t pt-3 px-3">
                  <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                    {activeOrg?.name ?? "My Stay"}
                  </p>
                  {residentNavItems.map((item) => {
                    const { href, label, icon: Icon, exact } = item as any;
                    const active = exact ? pathname === href : pathname.startsWith(href);
                    return (
                      <SidebarLink
                        key={href}
                        href={href}
                        icon={Icon}
                        label={label}
                        active={active}
                      />
                    );
                  })}
                </div>
              )}

              {/* Account settings */}
              <div className="mt-3 border-t pt-3 px-3">
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Account
                </p>
                <SidebarLink
                  href="/app/profile"
                  icon={UserRound}
                  label="Account settings"
                  active={pathname.startsWith("/app/profile")}
                />
                <SidebarLink
                  href="/app/timeline"
                  icon={History}
                  label="Full timeline"
                  active={pathname === "/app/timeline"}
                />
              </div>
            </nav>

            {/* Sign out button */}
            <div className="border-t p-3">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                onClick={() => void logout()}
              >
                Sign out
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-teal-50 text-teal-700 font-semibold dark:bg-teal-950/40 dark:text-teal-400"
          : "text-foreground hover:bg-muted",
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground")} />
      {label}
    </Link>
  );
}
