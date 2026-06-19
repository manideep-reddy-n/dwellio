"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { adminPlatformApi } from "@/lib/api/admin-platform";
import { toast } from "sonner";

export default function AdminUserIntelligencePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.userId as string;

  const user = useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: () => adminPlatformApi.getUser(userId),
    enabled: Boolean(userId),
  });

  const residents = useQuery({
    queryKey: ["admin", "residents", "user", userId],
    queryFn: () => adminPlatformApi.listResidents({ query: user.data?.email ?? "", size: 50 }),
    enabled: Boolean(user.data?.email),
  });

  const complaints = useQuery({
    queryKey: ["admin", "complaints", "user", userId],
    queryFn: () => adminPlatformApi.listComplaints({ query: user.data?.fullName ?? "", size: 20 }),
    enabled: Boolean(user.data?.fullName),
  });

  const payments = useQuery({
    queryKey: ["admin", "payments", "user", userId],
    queryFn: () => adminPlatformApi.listPayments({ query: user.data?.fullName ?? "", size: 20 }),
    enabled: Boolean(user.data?.fullName),
  });

  const reviews = useQuery({
    queryKey: ["admin", "reviews", "user", userId],
    queryFn: () => adminPlatformApi.listReviews({ query: user.data?.fullName ?? "", size: 20 }),
    enabled: Boolean(user.data?.fullName),
  });

  const audit = useQuery({
    queryKey: ["admin", "audit", "user", userId],
    queryFn: () => adminPlatformApi.listAuditLogs({ page: 0, size: 15 }),
  });

  const action = useMutation({
    mutationFn: (type: "suspend" | "activate" | "ban") => {
      if (type === "suspend") return adminPlatformApi.suspendUser(userId);
      if (type === "ban") return adminPlatformApi.banUser(userId);
      return adminPlatformApi.activateUser(userId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users", userId] });
      toast.success("Account updated");
    },
    onError: () => toast.error("Action failed"),
  });

  if (user.isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (user.isError || !user.data) return <ErrorState onRetry={() => void user.refetch()} />;

  const u = user.data;
  const memberships = (residents.data?.content ?? []).filter((r) => r.userId === userId);
  const userComplaints = (complaints.data?.content ?? []).filter(
    (c) => c.createdByName === u.fullName,
  );
  const userPayments = (payments.data?.content ?? []).filter((p) => p.residentName === u.fullName);
  const userReviews = (reviews.data?.content ?? []).filter((r) => r.authorName === u.fullName);
  const userAudit = (audit.data?.content ?? []).filter(
    (e) => e.actorName === u.fullName || e.entityId === userId,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/overview")}>
            ← Mission Control
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{u.fullName}</h1>
          <p className="text-muted-foreground">{u.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={u.active ? "default" : "destructive"}>{u.active ? "Active" : "Suspended"}</Badge>
          {u.platformAdmin && <Badge variant="secondary">Platform admin</Badge>}
          {u.emailVerified && <Badge variant="outline">Email verified</Badge>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Phone" value={u.phone} />
            <Field label="Joined" value={new Date(u.createdAt).toLocaleString()} />
            <Field label="Account status" value={u.active ? "Active" : "Suspended"} />
            <Field label="Platform role" value={u.platformAdmin ? "Administrator" : "Standard user"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {u.active ? (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={action.isPending}
                  onClick={() => action.mutate("suspend")}
                >
                  Suspend account
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={action.isPending}
                  onClick={() => action.mutate("ban")}
                >
                  Ban account
                </Button>
              </>
            ) : (
              <Button
                className="w-full"
                disabled={action.isPending}
                onClick={() => action.mutate("activate")}
              >
                Reactivate account
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightCard title={`Memberships (${memberships.length})`}>
          {memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">No organization memberships found.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {memberships.map((m) => (
                <li key={m.membershipId}>
                  <Link
                    href={`/admin/organizations/${m.organizationId}`}
                    className="flex justify-between rounded-lg border px-3 py-2 hover:bg-muted/50"
                  >
                    <span className="font-medium">{m.organizationName}</span>
                    <span className="text-muted-foreground">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </InsightCard>

        <InsightCard title={`Payments (${userPayments.length})`}>
          {userPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment records.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {userPayments.map((p) => (
                <li key={p.id} className="rounded-lg border px-3 py-2">
                  <div className="flex justify-between">
                    <span>{p.organizationName}</span>
                    <span className="font-medium">₹{p.amountPaid.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.billingMonth} · {p.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </InsightCard>

        <InsightCard title={`Complaints (${userComplaints.length})`}>
          {userComplaints.length === 0 ? (
            <p className="text-sm text-muted-foreground">No complaints filed.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {userComplaints.map((c) => (
                <li key={c.id} className="rounded-lg border px-3 py-2">
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.organizationName} · {c.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </InsightCard>

        <InsightCard title={`Reviews (${userReviews.length})`}>
          {userReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews submitted.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {userReviews.map((r) => (
                <li key={r.id} className="rounded-lg border px-3 py-2">
                  <div className="flex justify-between">
                    <span>{r.organizationName}</span>
                    <span className="font-medium">{r.rating}/5</span>
                  </div>
                  {r.body && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </InsightCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit history</CardTitle>
        </CardHeader>
        <CardContent>
          {userAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit entries for this user.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {userAudit.map((entry) => (
                <li key={entry.id} className="rounded-lg border px-3 py-2">
                  <p className="font-medium">{entry.action.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.actorName}
                    {entry.organizationName ? ` · ${entry.organizationName}` : ""} ·{" "}
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? "—"}</p>
    </div>
  );
}

function InsightCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
