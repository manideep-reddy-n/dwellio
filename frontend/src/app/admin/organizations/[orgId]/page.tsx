"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/shared/error-state";
import { FloorPlan } from "@/components/accommodation/floor-plan";
import { adminApi } from "@/lib/api/admin";
import { adminPlatformApi } from "@/lib/api/admin-platform";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AdminTab = "overview" | "intelligence" | "residents" | "blueprint" | "appeals";

export default function AdminOrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orgId = params.orgId as string;
  const [tab, setTab] = useState<AdminTab>("overview");
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: org, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "organizations", orgId],
    queryFn: () => adminApi.getOrganization(orgId),
    enabled: Boolean(orgId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["admin", "organizations", orgId, "members"],
    queryFn: () => adminApi.listMembers(orgId),
    enabled: Boolean(orgId) && tab === "overview",
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["admin", "organizations", orgId, "residents"],
    queryFn: () => adminApi.listResidents(orgId),
    enabled: Boolean(orgId) && (tab === "residents" || tab === "overview"),
  });

  const { data: viz } = useQuery({
    queryKey: ["admin", "organizations", orgId, "visualization"],
    queryFn: () => adminApi.visualization(orgId),
    enabled: Boolean(orgId) && tab === "blueprint",
  });

  const { data: occupancies = [] } = useQuery({
    queryKey: ["admin", "organizations", orgId, "occupancies"],
    queryFn: () => adminApi.listOccupancies(orgId),
    enabled: Boolean(orgId) && (tab === "blueprint" || tab === "residents"),
  });

  const { data: appeals = [] } = useQuery({
    queryKey: ["admin", "organizations", orgId, "appeals"],
    queryFn: () => adminApi.listAppeals(orgId),
    enabled: Boolean(orgId) && (tab === "appeals" || org?.status === "SUSPENDED"),
  });

  const { data: orgComplaints } = useQuery({
    queryKey: ["admin", "org-intel", orgId, "complaints"],
    queryFn: () => adminPlatformApi.listComplaints({ query: org?.name, size: 50 }),
    enabled: Boolean(orgId) && Boolean(org?.name) && tab === "intelligence",
  });

  const { data: orgPayments } = useQuery({
    queryKey: ["admin", "org-intel", orgId, "payments"],
    queryFn: () => adminPlatformApi.listPayments({ query: org?.name, size: 50 }),
    enabled: Boolean(orgId) && Boolean(org?.name) && tab === "intelligence",
  });

  const { data: orgReviews } = useQuery({
    queryKey: ["admin", "org-intel", orgId, "reviews"],
    queryFn: () => adminPlatformApi.listReviews({ query: org?.name, size: 50, includeHidden: true }),
    enabled: Boolean(orgId) && Boolean(org?.name) && tab === "intelligence",
  });

  const suspend = useMutation({
    mutationFn: () => adminApi.suspendOrganization(orgId),
    onSuccess: () => {
      toast.success("Organization suspended");
      void queryClient.invalidateQueries({ queryKey: ["admin", "organizations", orgId] });
    },
    onError: () => toast.error("Could not suspend"),
  });

  const unsuspend = useMutation({
    mutationFn: () => adminApi.unsuspendOrganization(orgId),
    onSuccess: () => {
      toast.success("Suspension lifted");
      void queryClient.invalidateQueries({ queryKey: ["admin", "organizations", orgId] });
    },
    onError: () => toast.error("Could not unsuspend"),
  });

  const reviewAppeal = useMutation({
    mutationFn: (appealId: string) => adminApi.reviewAppeal(orgId, appealId, reviewNotes),
    onSuccess: () => {
      toast.success("Appeal reviewed");
      setReviewNotes("");
      void queryClient.invalidateQueries({ queryKey: ["admin", "organizations", orgId, "appeals"] });
    },
    onError: () => toast.error("Could not review appeal"),
  });

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (isError || !org) return <ErrorState onRetry={() => void refetch()} />;

  const currentOccupancies = occupancies.filter((o) => o.current);
  const pendingAppeal = appeals.find((a) => a.status === "PENDING");

  const tabs: { id: AdminTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "intelligence", label: "Intelligence" },
    { id: "residents", label: `Residents (${residents.length})` },
    { id: "blueprint", label: "Blueprint" },
    ...(org.status === "SUSPENDED" || appeals.length > 0
      ? [{ id: "appeals" as const, label: `Appeals (${appeals.length})` }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/organizations")}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
          <p className="text-muted-foreground">
            {org.slug} · {org.type} · {org.city}
            {org.area ? `, ${org.area}` : ""}
          </p>
        </div>
        <Badge variant={org.status === "SUSPENDED" ? "destructive" : "secondary"}>{org.status}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={tab === t.id ? "default" : "outline"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Organization profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <ProfileField label="Contact phone" value={org.contactPhone} />
              <ProfileField label="Contact email" value={org.contactEmail} />
              <ProfileField label="Default rent" value={org.defaultMonthlyRent ? `₹${org.defaultMonthlyRent}` : null} />
              <ProfileField label="Active residents" value={String(org.activeResidentCount)} />
              <ProfileField label="Created" value={new Date(org.createdAt).toLocaleString()} />
              <ProfileField
                label="Verified"
                value={org.verifiedAt ? new Date(org.verifiedAt).toLocaleString() : "—"}
              />
              {org.rejectionReason && (
                <p className="col-span-full text-rose-600">Rejection: {org.rejectionReason}</p>
              )}
              {org.logoUrl && (
                <div className="relative col-span-full h-16 w-32 mt-2">
                  <Image src={org.logoUrl} alt="Logo" fill sizes="128px" className="rounded border object-contain" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(org.status === "DRAFT" ||
                org.status === "PENDING_VERIFICATION" ||
                org.status === "REJECTED") && (
                <Button variant="outline" className="w-full" onClick={() => router.push("/admin/verification-requests")}>
                  Open verification queue
                </Button>
              )}
              {org.status !== "SUSPENDED" ? (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={suspend.isPending}
                  onClick={() => suspend.mutate()}
                >
                  Suspend organization
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled={unsuspend.isPending}
                  onClick={() => unsuspend.mutate()}
                >
                  Lift suspension
                </Button>
              )}
              {pendingAppeal && (
                <p className="text-xs text-amber-700">
                  Pending owner appeal — review in Appeals tab.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Member summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-3">
                <StatPill label="Residents" value={residents.length} />
                <StatPill label="All members" value={members.length} />
                <StatPill label="Current occupancies" value={currentOccupancies.length} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "intelligence" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(orgPayments?.content ?? [])
                .filter((p) => p.organizationId === orgId)
                .slice(0, 8)
                .map((p) => (
                  <div key={p.id} className="flex justify-between rounded border px-3 py-2">
                    <span>{p.residentName}</span>
                    <span className="font-medium">₹{p.amountPaid.toLocaleString()}</span>
                  </div>
                ))}
              {(orgPayments?.content ?? []).filter((p) => p.organizationId === orgId).length === 0 && (
                <p className="text-muted-foreground">No payment records.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Complaints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(orgComplaints?.content ?? [])
                .filter((c) => c.organizationId === orgId)
                .slice(0, 8)
                .map((c) => (
                  <div key={c.id} className="rounded border px-3 py-2">
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.status} · {c.priority}
                    </p>
                  </div>
                ))}
              {(orgComplaints?.content ?? []).filter((c) => c.organizationId === orgId).length === 0 && (
                <p className="text-muted-foreground">No complaints.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reviews & trust</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(orgReviews?.content ?? [])
                .filter((r) => r.organizationId === orgId)
                .slice(0, 8)
                .map((r) => (
                  <div key={r.id} className="rounded border px-3 py-2">
                    <div className="flex justify-between">
                      <span>{r.authorName}</span>
                      <span className="font-medium">{r.rating}/5</span>
                    </div>
                    {r.body && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.body}</p>}
                  </div>
                ))}
              {(orgReviews?.content ?? []).filter((r) => r.organizationId === orgId).length === 0 && (
                <p className="text-muted-foreground">No reviews yet.</p>
              )}
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Occupancy & residents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-4">
                <StatPill label="Active residents" value={org.activeResidentCount} />
                <StatPill label="Members" value={members.length} />
                <StatPill label="Current occupancies" value={currentOccupancies.length} />
                <StatPill
                  label="Open complaints"
                  value={
                    (orgComplaints?.content ?? []).filter(
                      (c) => c.organizationId === orgId && c.status !== "RESOLVED" && c.status !== "CLOSED",
                    ).length
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "residents" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Residents & allocations</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Allocation</th>
                </tr>
              </thead>
              <tbody>
                {residents.map((m) => {
                  const occ = currentOccupancies.find((o) => o.membershipId === m.id);
                  return (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-4 font-medium">
                        <Link
                          href={`/admin/users/${m.userId}`}
                          className="text-teal-700 hover:underline"
                        >
                          {m.userFullName}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{m.userEmail}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="outline">{m.status}</Badge>
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {occ
                          ? occ.bedLabel ?? occ.unitIdentifier ?? "Allocated"
                          : "Not allocated"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {residents.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No residents yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "blueprint" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Accommodation blueprint (read-only)</CardTitle>
            </CardHeader>
            <CardContent>
              {viz ? (
                <FloorPlan visualization={viz} propertyName={org.name} allowLayoutEdit={false} />
              ) : (
                <Skeleton className="h-80 w-full rounded-xl" />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Occupancy ledger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {occupancies.map((o) => (
                <div
                  key={o.id}
                  className={cn(
                    "flex flex-wrap justify-between gap-2 rounded-lg border px-3 py-2",
                    o.current && "border-teal-200 bg-teal-50/50",
                  )}
                >
                  <span className="font-medium">{o.residentName}</span>
                  <span className="text-muted-foreground">
                    {o.bedLabel ?? o.unitIdentifier ?? "—"}
                    {o.current ? " · current" : ` · out ${o.moveOutDate ?? ""}`}
                  </span>
                </div>
              ))}
              {occupancies.length === 0 && (
                <p className="text-muted-foreground">No occupancy records.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "appeals" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suspension appeals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {appeals.map((appeal) => (
              <div key={appeal.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={appeal.status === "PENDING" ? "default" : "secondary"}>
                    {appeal.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(appeal.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm">{appeal.reason}</p>
                {appeal.adminNotes && (
                  <p className="mt-2 text-sm text-muted-foreground">Admin notes: {appeal.adminNotes}</p>
                )}
                {appeal.status === "PENDING" && (
                  <div className="mt-4 space-y-2">
                    <Label>Review notes</Label>
                    <Textarea
                      rows={3}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Optional notes for the owner…"
                    />
                    <Button
                      size="sm"
                      disabled={reviewAppeal.isPending}
                      onClick={() => reviewAppeal.mutate(appeal.id)}
                    >
                      Mark reviewed
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {appeals.length === 0 && (
              <p className="text-sm text-muted-foreground">No appeals submitted.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? "—"}</p>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
