"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/shared/page-title";
import { paymentsApi } from "@/lib/api/payments";
import { formatDate } from "@/lib/format/datetime";

function VerifyInvoiceContent() {
  const searchParams = useSearchParams();
  const invoiceNumber = searchParams.get("n") ?? "";
  const token = searchParams.get("t") ?? "";
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Awaited<ReturnType<typeof paymentsApi.verifyInvoice>> | null>(null);

  useEffect(() => {
    if (!invoiceNumber || !token) {
      setLoading(false);
      return;
    }
    void paymentsApi
      .verifyInvoice(invoiceNumber, token)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [invoiceNumber, token]);

  const verified = result?.result === "VERIFIED";

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <PageTitle title="Verify invoice" />
      <div>
        <h1 className="text-xl font-semibold">Invoice verification</h1>
        <p className="text-sm text-muted-foreground">
          Confirm that a Dwellio receipt is genuine using the number and token from the PDF.
        </p>
      </div>

      {loading && <Skeleton className="h-48 w-full rounded-xl" />}

      {!loading && (!invoiceNumber || !token) && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Missing invoice number or verification token. Open the link from your invoice PDF.
          </CardContent>
        </Card>
      )}

      {!loading && result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{result.invoiceNumber ?? "Unknown"}</CardTitle>
            <Badge variant={verified ? "default" : "destructive"}>{result.result}</Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {verified ? (
              <>
                <p>
                  <span className="text-muted-foreground">Organization:</span> {result.organizationName}
                </p>
                <p>
                  <span className="text-muted-foreground">Resident:</span> {result.residentName}
                </p>
                <p>
                  <span className="text-muted-foreground">Invoice date:</span>{" "}
                  {result.invoiceDate ? formatDate(result.invoiceDate) : "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Amount:</span> ₹{result.amount} · Paid ₹
                  {result.amountPaid}
                </p>
                <p>
                  <span className="text-muted-foreground">Payment status:</span> {result.paymentStatus}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">{result.result}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function VerifyInvoicePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <VerifyInvoiceContent />
    </Suspense>
  );
}
