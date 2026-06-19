"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Shield } from "lucide-react";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { NotificationPreferencesCard } from "@/components/profile/notification-preferences-card";
import { PageTransition } from "@/components/shared/page-transition";
import { PageTitle } from "@/components/shared/page-title";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useLeaveOrganization } from "@/hooks/use-leave-organization";
import { useMyMemberships } from "@/hooks/use-memberships";
import { orgHomePath } from "@/lib/navigation/app-routing";
import { permissionLabels } from "@/lib/permissions/labels";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: memberships = [], isLoading } = useMyMemberships();
  const leave = useLeaveOrganization();
  const [leaveTarget, setLeaveTarget] = useState<{
    organizationId: string;
    organizationName: string;
  } | null>(null);

  return (
    <PageTransition>
      <PageTitle title="Account settings" />
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account settings</h1>
          <p className="mt-1 text-muted-foreground">Profile, memberships, leave requests, and session.</p>
        </div>

        <ProfileSettingsForm memberships={memberships} />

        {user?.platformAdmin && (
          <Card>
            <CardContent className="pt-6">
              <p className="inline-flex items-center gap-1.5 text-sm text-teal-700">
                <Shield className="size-4" />
                Platform administrator ·{" "}
                <Link href="/admin/login" className="underline">
                  Open admin console
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">My memberships</CardTitle>
            <CardDescription>Leave a property you no longer stay at (owners cannot leave)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!isLoading && memberships.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No active memberships.{" "}
                <Link href="/explore" className="text-primary hover:underline">
                  Explore stays
                </Link>
                .
              </p>
            )}
            {memberships.map((m) => (
              <div
                key={m.membershipId}
                className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{m.organizationName}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.roleName}
                    {m.ownerRole ? " · Owner" : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(m.ownerRole
                      ? ["Full access to all organization operations"]
                      : m.permissions.map((code) => permissionLabels[code] ?? code)
                    ).map((label) => (
                      <Badge key={label} variant="secondary" className="text-[10px] font-normal">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={orgHomePath(m)}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Open
                  </Link>
                  {!m.ownerRole && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={leave.isPending}
                      onClick={() =>
                        setLeaveTarget({
                          organizationId: m.organizationId,
                          organizationName: m.organizationName,
                        })
                      }
                    >
                      Leave organization
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/app/notifications" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Open notification inbox
            </Link>
          </CardContent>
        </Card>

        <NotificationPreferencesCard />

        <Button variant="destructive" className="gap-2" onClick={() => void logout()}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>

      <Dialog open={leaveTarget != null} onOpenChange={(open) => !open && setLeaveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave {leaveTarget?.organizationName}?</DialogTitle>
            <DialogDescription>
              Your property owner must approve before you can leave. They will be notified immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={leave.isPending || !leaveTarget}
              onClick={() => {
                if (!leaveTarget) return;
                leave.mutate(
                  { organizationId: leaveTarget.organizationId },
                  {
                    onSuccess: () => {
                      toast.success(`Leave request sent to ${leaveTarget.organizationName}`);
                      setLeaveTarget(null);
                    },
                    onError: () => toast.error("Could not submit leave request"),
                  },
                );
              }}
            >
              Request to leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
