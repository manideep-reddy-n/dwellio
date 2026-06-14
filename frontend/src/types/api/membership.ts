import type { AccommodationMode, OrganizationType } from "@/types/enums";

export interface UserMembership {
  membershipId: string;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  organizationType: OrganizationType;
  logoUrl: string | null;
  accommodationMode: AccommodationMode;
  roleName: string;
  ownerRole: boolean;
  permissions: string[];
}

export type MembershipStatus = "ACTIVE" | "SUSPENDED" | "LEFT";

export interface OrgMembership {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  roleId: string;
  roleName: string;
  status: MembershipStatus;
  joinedAt: string | null;
}
