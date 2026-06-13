import { canAccessOperations, hasPermission } from "@/lib/permissions/evaluate";

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
): CommandNavItem[] {
  const items: CommandNavItem[] = [
    { id: "app", label: "App home", href: "/app", keywords: "dashboard hub" },
    { id: "orgs", label: "My organizations", href: "/app/organizations", keywords: "switch" },
    { id: "explore", label: "Explore marketplace", href: "/explore", keywords: "search stays" },
    { id: "profile", label: "Account", href: "/app/profile", keywords: "settings user" },
  ];

  if (!orgSlug) {
    return items;
  }

  const base = `/app/${orgSlug}`;

  items.push(
    { id: "live", label: "Live Operations Center", href: `${base}/operations/live`, keywords: "realtime demo" },
    { id: "ops", label: "Operations dashboard", href: `${base}/operations`, keywords: "metrics" },
  );

  if (canAccessOperations(permissions, isOwner)) {
    items.push(
      { id: "complaints", label: "Complaints", href: `${base}/operations/complaints`, keywords: "issues tickets" },
      { id: "announcements", label: "Announcements", href: `${base}/operations/announcements`, keywords: "notices broadcast" },
      { id: "residents", label: "Residents", href: `${base}/operations/residents`, keywords: "members join" },
      { id: "join-requests", label: "Join requests", href: `${base}/operations/join-requests`, keywords: "approve pending" },
      { id: "accommodation", label: "Accommodation", href: `${base}/operations/accommodation`, keywords: "buildings floors beds" },
      { id: "assets", label: "Assets", href: `${base}/operations/assets`, keywords: "equipment maintenance" },
      { id: "reviews-ops", label: "Reviews (ops)", href: `${base}/operations/reviews`, keywords: "moderation feedback" },
      { id: "staff", label: "Staff & roles", href: `${base}/operations/staff`, keywords: "invite permissions" },
      { id: "settings", label: "Org settings", href: `${base}/operations/settings`, keywords: "profile contact" },
    );
  }

  if (hasPermission(permissions, isOwner, "complaint:read_own") || hasPermission(permissions, isOwner, "complaint:create")) {
    items.push(
      { id: "my-complaints", label: "My complaints", href: `${base}/resident/complaints`, keywords: "resident issues" },
    );
  }

  if (hasPermission(permissions, isOwner, "announcement:read_own")) {
    items.push(
      { id: "my-announcements", label: "Announcements (resident)", href: `${base}/resident/announcements`, keywords: "notices" },
      { id: "resident-home", label: "Resident home", href: `${base}/resident`, keywords: "dashboard stay" },
    );
  }

  if (hasPermission(permissions, isOwner, "review:create") || hasPermission(permissions, isOwner, "review:update_own")) {
    items.push(
      { id: "my-review", label: "My review", href: `${base}/resident/review`, keywords: "rating feedback" },
    );
  }

  items.push({ id: "notifications", label: "Notifications inbox", href: "/app/notifications", keywords: "alerts bell" });
  items.push({ id: "new-org", label: "Create organization", href: "/app/organizations/new", keywords: "setup property" });

  if (platformAdmin) {
    items.push({ id: "admin", label: "Platform admin", href: "/admin", keywords: "system health organizations" });
  }

  return items;
}
