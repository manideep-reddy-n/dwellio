import type { UserMembership } from "@/types/api/membership";
import { canAccessOperations } from "@/lib/permissions/evaluate";

export function orgHomePath(membership: UserMembership): string {
  return canAccessOperations(membership.permissions, membership.ownerRole)
    ? `/app/${membership.organizationSlug}/operations`
    : `/app/${membership.organizationSlug}/resident`;
}

/** Where /app and marketing CTA should land for this user. */
export function resolveAppHome(memberships: UserMembership[]): string {
  if (memberships.length === 0) {
    return "/app/organizations";
  }
  if (memberships.length === 1) {
    return orgHomePath(memberships[0]);
  }
  return "/app/organizations";
}

export function isResidentOnlyUser(memberships: UserMembership[]): boolean {
  return (
    memberships.length > 0 &&
    memberships.every((m) => !canAccessOperations(m.permissions, m.ownerRole))
  );
}

/** Property owners may create orgs; residents who joined a stay may not. */
export function canCreateOrganization(memberships: UserMembership[]): boolean {
  if (memberships.length === 0) {
    return true;
  }
  return memberships.some((m) => m.ownerRole);
}

export function appHomeLabel(memberships: UserMembership[]): string {
  if (memberships.length === 0) {
    return "My organizations";
  }
  if (isResidentOnlyUser(memberships)) {
    return "My stay";
  }
  return "Dashboard";
}

export function activeOrgNav(
  orgSlug: string,
  permissions: string[],
  isOwner: boolean,
): { href: string; label: string }[] {
  if (canAccessOperations(permissions, isOwner)) {
    return [
      { href: `/app/${orgSlug}/operations`, label: "Home" },
      { href: `/app/${orgSlug}/operations/live`, label: "Live" },
    ];
  }

  return [{ href: `/app/${orgSlug}/resident`, label: "Home" }];
}
