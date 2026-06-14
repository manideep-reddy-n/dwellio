"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useInviteStaff, useRoleMutations, useRoles } from "@/hooks/use-roles";
import { allAssignablePermissions, permissionLabels } from "@/lib/permissions/labels";
import type { Role } from "@/types/api/role";
import { toast } from "sonner";

interface StaffRolesManagerProps {
  orgId: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function StaffRolesManager({ orgId, isLoading, isError, onRetry }: StaffRolesManagerProps) {
  const { data: roles, isLoading: rolesLoading, isError: rolesError, refetch } = useRoles(orgId);
  const { create, update, remove } = useRoleMutations(orgId);
  const invite = useInviteStaff(orgId);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roleName, setRoleName] = useState("");
  const [rolePerms, setRolePerms] = useState<string[]>([]);

  const loading = isLoading || rolesLoading;
  const error = isError || rolesError;

  if (loading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (error) return <ErrorState onRetry={onRetry ?? (() => void refetch())} />;

  async function handleInvite() {
    if (!email.trim() || !roleId) {
      toast.error("Email and role are required");
      return;
    }
    try {
      const result = await invite.mutateAsync({ email: email.trim(), roleId });
      toast.success(result.message || "Invitation sent");
      setInviteOpen(false);
      setEmail("");
    } catch {
      toast.error("Could not invite staff");
    }
  }

  async function handleSaveRole() {
    if (!roleName.trim() || !rolePerms.length) {
      toast.error("Name and at least one permission required");
      return;
    }
    try {
      if (editingRole) {
        await update.mutateAsync({
          id: editingRole.id,
          input: { name: roleName.trim(), permissions: rolePerms },
        });
        toast.success("Role updated");
      } else {
        await create.mutateAsync({ name: roleName.trim(), permissions: rolePerms });
        toast.success("Role created");
      }
      setRoleOpen(false);
      setEditingRole(null);
      setRoleName("");
      setRolePerms([]);
    } catch {
      toast.error(editingRole ? "Could not update role" : "Could not create role");
    }
  }

  function openCreateRole() {
    setEditingRole(null);
    setRoleName("");
    setRolePerms([]);
    setRoleOpen(true);
  }

  function openEditRole(role: Role) {
    setEditingRole(role);
    setRoleName(role.name);
    setRolePerms([...role.permissions]);
    setRoleOpen(true);
  }

  function togglePerm(code: string) {
    setRolePerms((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code],
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger render={<Button className="gap-2" />}>
            <UserPlus className="size-4" />
            Invite staff
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite staff member</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="staff-role">Role</Label>
                <select
                  id="staff-role"
                  className="flex h-9 w-full rounded-lg border bg-background px-3 text-sm"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                >
                  <option value="">Select role…</option>
                  {roles?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button disabled={invite.isPending} onClick={() => void handleInvite()}>
                Send invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={openCreateRole}>
          New role
        </Button>

        <Dialog
          open={roleOpen}
          onOpenChange={(open) => {
            setRoleOpen(open);
            if (!open) setEditingRole(null);
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRole ? "Edit role" : "Create role"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="role-name">Name</Label>
                <Input
                  id="role-name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
                  {allAssignablePermissions.map((code) => (
                    <label key={code} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={rolePerms.includes(code)}
                        onChange={() => togglePerm(code)}
                      />
                      {permissionLabels[code] ?? code}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={create.isPending || update.isPending}
                onClick={() => void handleSaveRole()}
              >
                {editingRole ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!roles?.length ? (
        <EmptyState title="No roles" description="Create custom roles for your staff." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={() => openEditRole(role)}
              onDelete={() => {
                if (role.system || role.ownerRole) {
                  toast.error("System roles cannot be deleted");
                  return;
                }
                remove.mutate(role.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RoleCard({
  role,
  onEdit,
  onDelete,
}: {
  role: Role;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-base">{role.name}</CardTitle>
        {role.system && <Badge variant="secondary">System</Badge>}
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex flex-wrap gap-1">
          {role.permissions.slice(0, 6).map((p) => (
            <Badge key={p} variant="outline" className="text-[10px]">
              {permissionLabels[p] ?? p}
            </Badge>
          ))}
          {role.permissions.length > 6 && (
            <Badge variant="outline" className="text-[10px]">
              +{role.permissions.length - 6}
            </Badge>
          )}
        </div>
        {!role.system && !role.ownerRole && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete}>
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
