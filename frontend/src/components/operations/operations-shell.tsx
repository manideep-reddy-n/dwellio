"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { canAccessOperations } from "@/lib/permissions/evaluate";

interface OperationsShellProps {
  orgSlug: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function OperationsShell({
  title,
  description,
  children,
  actions,
}: OperationsShellProps) {
  const { permissions, isOwner } = usePermissions();

  if (!canAccessOperations(permissions, isOwner)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>

      {children}
    </div>
  );
}
