"use client";

import Link from "next/link";
import { AlertTriangle, Star } from "lucide-react";
import { AccommodationHistoryView } from "@/components/operations/accommodation-history-view";
import { LedgerView } from "@/components/operations/ledger-view";
import { ComplaintStatusBadge } from "@/components/resident/complaint-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { VerticalTimeline } from "@/components/shared/vertical-timeline";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTimeline } from "@/hooks/use-timeline";
import { formatDate, formatRelativeTime } from "@/lib/format/datetime";
import { formatInr } from "@/lib/format/currency";
import {
  complaintCategoryLabels,
  complaintPriorityLabels,
} from "@/lib/resident/labels";
import type { ResidentLifecycleProfile } from "@/types/api/resident-lifecycle";
import type { PaymentStatus } from "@/lib/api/payments";

const paymentStatusStyles: Record<PaymentStatus, string> = {
  PAID: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-slate-100 text-slate-700",
  PARTIAL: "bg-amber-100 text-amber-900",
  OVERDUE: "bg-rose-100 text-rose-800",
};

interface ResidentLifecycleProfileViewProps {
  orgId: string;
  orgSlug: string;
  profile: ResidentLifecycleProfile | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function ResidentLifecycleProfileView({
  orgId,
  orgSlug,
  profile,
  isLoading,
  isError,
  onRetry,
}: ResidentLifecycleProfileViewProps) {
  const membershipId = profile?.membership.id;
  const { data: timeline = [], isLoading: timelineLoading } = useTimeline(orgId, membershipId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (isError || !profile) {
    return <ErrorState onRetry={onRetry} />;
  }

  const { membership, financialSummary, complaintMetrics } = profile;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{membership.userFullName}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{membership.userEmail}</p>
              {membership.userPhone && (
                <p className="text-sm text-muted-foreground">{membership.userPhone}</p>
              )}
            </div>
            <Badge variant={membership.status === "ACTIVE" ? "default" : "secondary"}>
              {membership.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-muted-foreground">Joined</p>
            <p className="font-medium">
              {membership.joinedAt ? formatDate(membership.joinedAt) : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Current stay</p>
            <p className="font-medium">
              {profile.currentOccupancy
                ? profile.currentOccupancy.bedLabel ?? profile.currentOccupancy.unitIdentifier ?? "Allocated"
                : "Not allocated"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Emergency contact</p>
            <p className="font-medium">
              {membership.emergencyContactName ?? "—"}
              {membership.emergencyContactPhone && (
                <span className="block text-muted-foreground">{membership.emergencyContactPhone}</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Outstanding balance</p>
            <p className="text-lg font-bold">{formatInr(financialSummary.outstandingBalance)}</p>
            <p className="text-xs text-muted-foreground">
              {financialSummary.pendingPaymentsCount} pending payment
              {financialSummary.pendingPaymentsCount === 1 ? "" : "s"}
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Accommodation history</h2>
        <AccommodationHistoryView records={profile.accommodationHistory} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Financial</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Total billed</p>
              <p className="text-lg font-bold">{formatInr(financialSummary.totalBilled)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Total paid</p>
              <p className="text-lg font-bold">{formatInr(financialSummary.totalPaid)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="text-lg font-bold">{formatInr(financialSummary.outstandingBalance)}</p>
            </CardContent>
          </Card>
        </div>

        {profile.payments.length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {profile.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{payment.chargeType}</span>
                      <Badge className={paymentStatusStyles[payment.status]} variant="outline">
                        {payment.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(payment.dueDate)} · {payment.billingMonth.slice(0, 7)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatInr(payment.amount)}</p>
                    <p className="text-xs text-muted-foreground">Paid {formatInr(payment.amountPaid)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState title="No payments" description="Charges and payments will appear here." />
        )}

        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Ledger</h3>
          <LedgerView entries={profile.ledgerEntries} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Complaints</h2>
          {complaintMetrics.openComplaints > 0 && (
            <Link
              href={`/app/${orgSlug}/operations/complaints`}
              className="text-sm text-teal-700 hover:underline"
            >
              View kanban
            </Link>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{complaintMetrics.totalComplaints}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Open</p>
              <p className="text-lg font-bold">{complaintMetrics.openComplaints}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Avg first response</p>
              <p className="text-lg font-bold">
                {complaintMetrics.avgFirstResponseHours != null
                  ? `${complaintMetrics.avgFirstResponseHours.toFixed(1)}h`
                  : "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Avg resolution</p>
              <p className="text-lg font-bold">
                {complaintMetrics.avgResolutionDays != null
                  ? `${complaintMetrics.avgResolutionDays.toFixed(1)}d`
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </div>
        {profile.complaints.length > 0 ? (
          <div className="space-y-2">
            {profile.complaints.map((complaint) => (
              <Card key={complaint.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-3 py-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{complaint.title}</p>
                      <ComplaintStatusBadge status={complaint.status} />
                      {complaint.slaBreached && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                          <AlertTriangle className="size-3" />
                          SLA breach
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {complaintCategoryLabels[complaint.category]} ·{" "}
                      {complaintPriorityLabels[complaint.priority]} ·{" "}
                      {formatRelativeTime(complaint.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No complaints" description="This resident has not filed any complaints." />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Reviews</h2>
        {profile.reviews.length > 0 ? (
          profile.reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="mt-2 text-sm">{review.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submitted {formatRelativeTime(review.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState title="No review" description="This resident has not submitted an organization review." />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Activity timeline</h2>
        {timelineLoading ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : (
          <VerticalTimeline events={timeline} />
        )}
      </section>
    </div>
  );
}
