"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { countByField, StatusFilterTabs } from "@/components/shared/status-filter-tabs";
import { useResidents } from "@/hooks/use-residents";
import {
  useCreateManualCharge,
  useGenerateInvoice,
  useOrgPayments,
  useRecordPayment,
  useShareInvoice,
} from "@/hooks/use-payments";
import type { ChargeType, PaymentRecord, PaymentStatus } from "@/lib/api/payments";
import { paymentsApi } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format/datetime";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusStyles: Record<PaymentStatus, string> = {
  PAID: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PENDING: "bg-slate-100 text-slate-700 border-slate-200",
  PARTIAL: "bg-amber-100 text-amber-900 border-amber-200",
  OVERDUE: "bg-rose-100 text-rose-800 border-rose-200",
};

const CHARGE_TYPES: ChargeType[] = [
  "RENT",
  "MAINTENANCE",
  "UTILITY",
  "PENALTY",
  "DEPOSIT",
  "PARKING",
  "AMENITY",
  "OTHER",
];

const PAYMENT_FILTERS: Array<PaymentStatus | "ALL"> = [
  "ALL",
  "PAID",
  "PENDING",
  "PARTIAL",
  "OVERDUE",
];

const PAYMENT_FILTER_LABELS: Record<PaymentStatus | "ALL", string> = {
  ALL: "All",
  PAID: "Paid",
  PENDING: "Pending",
  PARTIAL: "Partial",
  OVERDUE: "Overdue",
};

interface PaymentManagerProps {
  orgId: string;
}

export function PaymentManager({ orgId }: PaymentManagerProps) {
  const { data: payments = [], isLoading } = useOrgPayments(orgId);
  const { data: residents = [] } = useResidents(orgId);
  const record = useRecordPayment(orgId);
  const createManual = useCreateManualCharge(orgId);
  const generateInvoice = useGenerateInvoice(orgId);
  const shareInvoice = useShareInvoice(orgId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [chargeType, setChargeType] = useState<ChargeType>("MAINTENANCE");
  const [manualAmount, setManualAmount] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualDueDate, setManualDueDate] = useState("");
  const [selectedResidents, setSelectedResidents] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");

  const filteredPayments = useMemo(
    () =>
      statusFilter === "ALL"
        ? payments
        : payments.filter((payment) => payment.status === statusFilter),
    [payments, statusFilter],
  );

  const paymentFilterOptions = useMemo(
    () =>
      PAYMENT_FILTERS.map((value) => ({
        value,
        label: PAYMENT_FILTER_LABELS[value],
        count: countByField(payments, "status", value),
      })),
    [payments],
  );

  function startEdit(payment: PaymentRecord) {
    setEditingId(payment.id);
    setAmountPaid(String(payment.amountPaid));
    setNotes(payment.notes ?? "");
  }

  async function save(payment: PaymentRecord) {
    const paid = Number(amountPaid);
    if (Number.isNaN(paid) || paid < 0) {
      toast.error("Enter a valid paid amount");
      return;
    }
    if (paid > payment.amount) {
      toast.error(`Paid amount cannot exceed ₹${payment.amount}`);
      return;
    }
    let status: PaymentStatus = "PENDING";
    if (paid >= payment.amount) status = "PAID";
    else if (paid > 0) status = "PARTIAL";
    else if (new Date(payment.dueDate) < new Date()) status = "OVERDUE";

    try {
      await record.mutateAsync({
        paymentId: payment.id,
        body: { status, amountPaid: paid, notes: notes || undefined },
      });
      toast.success("Payment updated");
      setEditingId(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update payment");
    }
  }

  async function submitManualCharge() {
    const amount = Number(manualAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!manualDueDate) {
      toast.error("Select a due date");
      return;
    }
    if (selectedResidents.length === 0) {
      toast.error("Select at least one resident");
      return;
    }
    try {
      await createManual.mutateAsync({
        chargeType,
        amount,
        description: manualDescription || undefined,
        dueDate: manualDueDate,
        membershipIds: selectedResidents,
      });
      toast.success("Charges created");
      setShowManual(false);
      setManualAmount("");
      setManualDescription("");
      setManualDueDate("");
      setSelectedResidents([]);
    } catch {
      toast.error("Could not create charges");
    }
  }

  function toggleResident(id: string) {
    setSelectedResidents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleGenerateInvoice(payment: PaymentRecord) {
    try {
      await generateInvoice.mutateAsync(payment.id);
      toast.success("Invoice generated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not generate invoice");
    }
  }

  async function handleShareInvoice(payment: PaymentRecord) {
    try {
      if (!payment.invoiceId) {
        await generateInvoice.mutateAsync(payment.id);
      }
      await shareInvoice.mutateAsync(payment.id);
      toast.success("Invoice shared with resident");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not share invoice");
    }
  }

  async function handleDownload(payment: PaymentRecord) {
    if (!payment.invoiceNumber) return;
    try {
      await paymentsApi.downloadInvoice(orgId, payment.id, `${payment.invoiceNumber}.pdf`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not download invoice");
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Monthly rent is generated per occupancy. Gated communities use manual charges only.
        </p>
        <Button size="sm" variant="outline" onClick={() => setShowManual((v) => !v)}>
          {showManual ? "Cancel" : "Add manual charge"}
        </Button>
      </div>

      {payments.length > 0 && (
        <StatusFilterTabs
          value={statusFilter}
          onChange={setStatusFilter}
          options={paymentFilterOptions}
        />
      )}

      {showManual && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manual charge</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Charge type</Label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={chargeType}
                onChange={(e) => setChargeType(e.target.value as ChargeType)}
              >
                {CHARGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Amount (₹)</Label>
              <Input value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} />
            </div>
            <div>
              <Label>Due date</Label>
              <Input type="date" value={manualDueDate} onChange={(e) => setManualDueDate(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Residents</Label>
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                {residents.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedResidents.includes(r.id)}
                      onChange={() => toggleResident(r.id)}
                    />
                    {r.userFullName ?? r.userEmail}
                  </label>
                ))}
                {residents.length === 0 && (
                  <p className="text-xs text-muted-foreground">No residents found</p>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Button disabled={createManual.isPending} onClick={() => void submitManualCharge()}>
                Create charges
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {payments.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No payment records yet. Allocate residents or add a manual charge.
        </p>
      )}

      {payments.length > 0 && filteredPayments.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No {statusFilter === "ALL" ? "" : PAYMENT_FILTER_LABELS[statusFilter].toLowerCase() + " "}
          payments in this view.
        </p>
      )}

      {filteredPayments.map((payment) => (
        <div key={payment.id} className={cn("rounded-xl border p-4", statusStyles[payment.status])}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{payment.residentName}</p>
              <p className="text-xs opacity-80">
                {payment.chargeType}
                {payment.description ? ` · ${payment.description}` : ""} · due {formatDate(payment.dueDate)}
              </p>
            </div>
            <Badge variant="outline" className="bg-background/60">
              {payment.status}
            </Badge>
          </div>
          <p className="mt-2 text-sm">
            ₹{payment.amountPaid} / ₹{payment.amount}
            {payment.amountPaid > payment.amount && (
              <span className="ml-2 text-xs text-destructive">Paid exceeds due</span>
            )}
          </p>

          {(payment.status === "PAID" || payment.status === "PARTIAL") && payment.invoiceId && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-background/70"
                onClick={() => void handleDownload(payment)}
              >
                Download PDF
              </Button>
              {payment.invoiceNumber && (
                <span className="self-center text-xs opacity-70">{payment.invoiceNumber}</span>
              )}
            </div>
          )}

          {editingId === payment.id ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Paid amount (max ₹{payment.amount})</Label>
                <Input
                  type="number"
                  min={0}
                  max={payment.amount}
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button
                  size="sm"
                  disabled={
                    record.isPending ||
                    Number.isNaN(Number(amountPaid)) ||
                    Number(amountPaid) < 0 ||
                    Number(amountPaid) > payment.amount
                  }
                  onClick={() => void save(payment)}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="bg-background/70" onClick={() => startEdit(payment)}>
                Update payment
              </Button>
              {payment.status !== "PAID" && payment.residentPhone && (
                <a
                  href={`tel:${payment.residentPhone}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "border-emerald-300 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-medium",
                  )}
                >
                  <Phone className="mr-1.5 size-3.5 text-emerald-600" />
                  Call resident
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
