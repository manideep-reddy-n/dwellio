export const permissionLabels: Record<string, string> = {
  "dashboard:view": "View dashboard",
  "building:manage": "Manage buildings & accommodation",
  "complaint:read": "View all complaints",
  "complaint:manage": "Manage complaints",
  "complaint:assign": "Assign complaints",
  "complaint:create": "Create complaints",
  "complaint:read_own": "View own complaints",
  "announcement:manage": "Manage announcements",
  "announcement:read": "View announcements",
  "announcement:read_own": "View published announcements",
  "resident:approve": "Approve join requests",
  "resident:manage": "Manage residents",
  "staff:manage": "Invite staff",
  "role:manage": "Manage roles",
  "organization:update": "Update organization settings",
  "review:create": "Create reviews",
  "review:update_own": "Update own review",
  "asset:manage": "Manage assets",
};

export const allAssignablePermissions = Object.keys(permissionLabels);
