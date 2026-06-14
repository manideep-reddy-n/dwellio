"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyPayments } from "@/hooks/use-payments";
import { usePermissions } from "@/hooks/use-permissions";
import { ApiError } from "@/lib/api/client";
import { paymentsApi } from "@/lib/api/payments";
import { formatDate } from "@/lib/format/datetime";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/api/payments";
import { toast } from "sonner";

const statusStyles: Record<PaymentStatus, string> = {
  PAID: "border-emerald-300 bg-emerald-50/50",
  PENDING: "border-slate-200",
  PARTIAL: "border-amber-300 bg-amber-50/50",
  OVERDUE: "border-rose-300 bg-rose-50/50",
};

export default function ResidentPaymentsPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const { data: payments = [], isLoading } = useMyPayments(orgId);

  async function downloadInvoice(paymentId: string, invoiceNumber: string) {
    if (!orgId) return;
    try {
      await paymentsApi.downloadInvoice(orgId, paymentId, `${invoiceNumber}.pdf`);
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 403
          ? "Invoice will appear after your property team shares it"
          : "Could not download invoice";
      toast.error(message);
    }
  }

  return (
    <PageTransition>
      <PageTitle title="My payments" />
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">My payments</h1>
          <p className="text-sm text-muted-foreground">
            Monthly rent from your move-in date. Pay your property team and they will update status here.
          </p>
        </div>
        {isLoading && <Skeleton className="h-40 w-full rounded-xl" />}
        {!isLoading && payments.length === 0 && (
          <p className="text-sm text-muted-foreground">No payment records yet.</p>
        )}
        {payments.map((p) => {
          const invoiceReady =
            Boolean(p.invoiceId && p.invoiceNumber) &&
            (p.invoiceShared || p.invoiceStatus === "SHARED");

          return (
          <Card key={p.id} className={cn(statusStyles[p.status])}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {p.chargeType}
                {p.description ? ` · ${p.description}` : ""} · {p.status}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Due ₹{p.amount} · Paid ₹{p.amountPaid}
              </p>
              <p className="text-muted-foreground">Due date {formatDate(p.dueDate)}</p>
              {invoiceReady && orgId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void downloadInvoice(p.id, p.invoiceNumber!)}
                >
                  Download invoice
                </Button>
              )}
            </CardContent>
          </Card>
          );
        })}
      </div>
    </PageTransition>
  );
}
