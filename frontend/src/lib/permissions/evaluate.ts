export function hasPermission(
  permissions: string[],
  isOwner: boolean,
  required: string,
): boolean {
  if (isOwner) return true;
  return permissions.includes(required);
}

export function canAccessOperations(permissions: string[], isOwner: boolean): boolean {
  return (
    isOwner ||
    permissions.includes("dashboard:view") ||
    permissions.includes("complaint:read") ||
    permissions.includes("building:manage") ||
    permissions.includes("resident:approve")
  );
}

export function canAccessLiveOps(permissions: string[], isOwner: boolean): boolean {
  return canAccessOperations(permissions, isOwner);
}
