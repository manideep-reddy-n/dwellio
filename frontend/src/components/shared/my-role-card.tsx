"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/use-permissions";
import { permissionLabels } from "@/lib/permissions/labels";

export function MyRoleCard({ className }: { className?: string }) {
  const { activeOrg, permissions, isOwner } = usePermissions();

  if (!activeOrg) return null;

  const abilityList = isOwner
    ? ["Full access to all organization operations"]
    : permissions.map((code) => permissionLabels[code] ?? code);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Your role at {activeOrg.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>
          <span className="text-muted-foreground">Role</span>
          <br />
          <span className="font-medium">
            {activeOrg.roleName}
            {isOwner ? " (Owner)" : ""}
          </span>
        </p>
        <div>
          <p className="mb-2 text-muted-foreground">What you can do</p>
          <div className="flex flex-wrap gap-1.5">
            {abilityList.map((label) => (
              <Badge key={label} variant="secondary" className="font-normal">
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
