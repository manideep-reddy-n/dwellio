import type { OrgContext } from "@/stores/org-store";
import type { UserMembership } from "@/types/api/membership";

export function membershipToOrgContext(membership: UserMembership): OrgContext {
  return {
    id: membership.organizationId,
    slug: membership.organizationSlug,
    name: membership.organizationName,
    accommodationMode: membership.accommodationMode,
    permissions: membership.permissions,
    isOwner: membership.ownerRole,
    roleName: membership.roleName,
  };
}
