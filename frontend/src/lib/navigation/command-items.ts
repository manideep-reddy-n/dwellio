import { canAccessOperations, hasPermission } from "@/lib/permissions/evaluate";
import type { UserMembership } from "@/types/api/membership";
import { canCreateOrganization, resolveAppHome } from "@/lib/navigation/app-routing";

export interface CommandNavItem {
  id: string;
  label: string;
  href: string;
  keywords?: string;
}

export function buildCommandItems(
  orgSlug: string | undefined,
  permissions: string[],
  isOwner: boolean,
  platformAdmin?: boolean,
  memberships: UserMembership[] = [],
): CommandNavItem[] {
  const appHome = resolveAppHome(memberships);
  const items: CommandNavItem[] = [
    { id: "app", label: "Go to dashboard", href: appHome, keywords: "dashboard hub home" },
    { id: "explore", label: "Explore marketplace", href: "/explore", keywords: "search stays" },
    { id: "profile", label: "Account", href: "/app/profile", keywords: "settings user" },
  ];

  if (memberships.length > 1) {
    items.splice(1, 0, {
      id: "orgs",
      label: memberships.every((m) => !canAccessOperations(m.permissions, m.ownerRole))
        ? "My stays"
        : "My organizations",
      href: "/app/organizations",
      keywords: "switch properties",
    });
  }

  if (!orgSlug) {
    return appendGlobalItems(items, platformAdmin, memberships);
  }

  const base = `/app/${orgSlug}`;

  if (canAccessOperations(permissions, isOwner)) {
    items.push(
      { id: "live", label: "Live Operations Center", href: `${base}/operations/live`, keywords: "realtime demo" },
      { id: "ops", label: "Operations dashboard", href: `${base}/operations`, keywords: "metrics" },
      { id: "complaints", label: "Complaints", href: `${base}/operations/complaints`, keywords: "issues tickets" },
      { id: "announcements", label: "Announcements", href: `${base}/operations/announcements`, keywords: "notices broadcast" },
      { id: "residents", label: "Residents", href: `${base}/operations/residents`, keywords: "members join" },
      { id: "join-requests", label: "Join requests", href: `${base}/operations/join-requests`, keywords: "approve pending" },
      { id: "accommodation", label: "Accommodation", href: `${base}/operations/accommodation`, keywords: "buildings floors beds" },
    );
  }

  if (hasPermission(permissions, isOwner, "complaint:read_own") || hasPermission(permissions, isOwner, "complaint:create")) {
    items.push(
      { id: "my-complaints", label: "My complaints", href: `${base}/resident/complaints`, keywords: "resident issues" },
    );
  }

  if (hasPermission(permissions, isOwner, "announcement:read_own")) {
    items.push(
      { id: "my-announcements", label: "Announcements", href: `${base}/resident/announcements`, keywords: "notices" },
      { id: "resident-home", label: "Resident home", href: `${base}/resident`, keywords: "dashboard stay" },
    );
  }

  if (hasPermission(permissions, isOwner, "review:create") || hasPermission(permissions, isOwner, "review:update_own")) {
    items.push(
      { id: "my-review", label: "My review", href: `${base}/resident/review`, keywords: "rating feedback" },
    );
  }

  return appendGlobalItems(items, platformAdmin, memberships);
}

function appendGlobalItems(
  items: CommandNavItem[],
  platformAdmin: boolean | undefined,
  memberships: UserMembership[],
): CommandNavItem[] {
  items.push({ id: "notifications", label: "Notifications inbox", href: "/app/notifications", keywords: "alerts bell" });

  if (canCreateOrganization(memberships)) {
    items.push({
      id: "new-org",
      label: "Create organization",
      href: "/app/organizations/new",
      keywords: "setup property",
    });
  }

  if (platformAdmin) {
    items.push({ id: "admin", label: "Platform admin", href: "/admin", keywords: "system health organizations" });
  }

  return items;
}
