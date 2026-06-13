export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",
  BUILDING_MANAGE: "building:manage",
  COMPLAINT_READ: "complaint:read",
  COMPLAINT_MANAGE: "complaint:manage",
  COMPLAINT_ASSIGN: "complaint:assign",
  COMPLAINT_CREATE: "complaint:create",
  COMPLAINT_READ_OWN: "complaint:read_own",
  ANNOUNCEMENT_MANAGE: "announcement:manage",
  ANNOUNCEMENT_READ: "announcement:read",
  RESIDENT_APPROVE: "resident:approve",
  RESIDENT_MANAGE: "resident:manage",
  STAFF_MANAGE: "staff:manage",
  ROLE_MANAGE: "role:manage",
  ORGANIZATION_UPDATE: "organization:update",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
