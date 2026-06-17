"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useCreateOwnershipRecord, useOwnershipRecords } from "@/hooks/use-ownership";
import { formatDate } from "@/lib/format/datetime";
import { toast } from "sonner";
import type { BillingResponsibility } from "@/lib/api/ownership";

interface OwnershipPanelProps {
  orgId: string;
}

const billingLabels: Record<BillingResponsibility, string> = {
  OWNER: "Owner",
  TENANT: "Tenant",
  RESIDENT: "Resident",
};

export function OwnershipPanel({ orgId }: OwnershipPanelProps) {
  const { data: records = [], isLoading } = useOwnershipRecords(orgId);
  const createRecord = useCreateOwnershipRecord(orgId);
  const [unitSpaceId, setUnitSpaceId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [billingResponsibility, setBillingResponsibility] = useState<BillingResponsibility>("OWNER");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!unitSpaceId.trim() || !ownerName.trim()) {
      toast.error("Unit ID and owner name are required");
      return;
    }
    try {
      await createRecord.mutateAsync({
        unitSpaceId: unitSpaceId.trim(),
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim() || undefined,
        billingResponsibility,
        effectiveFrom,
      });
      toast.success("Ownership record added");
      setOwnerName("");
      setOwnerEmail("");
    } catch {
      toast.error("Could not save ownership record");
    }
  }

  if (isLoading) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add owner record</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unitSpaceId">Unit space ID</Label>
              <Input
                id="unitSpaceId"
                value={unitSpaceId}
                onChange={(e) => setUnitSpaceId(e.target.value)}
                placeholder="UUID from accommodation map"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner name</Label>
              <Input id="ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Owner email</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingResponsibility">Billing responsibility</Label>
              <select
                id="billingResponsibility"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={billingResponsibility}
                onChange={(e) => setBillingResponsibility(e.target.value as BillingResponsibility)}
              >
                <option value="OWNER">Owner</option>
                <option value="TENANT">Tenant</option>
                <option value="RESIDENT">Resident</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">Effective from</Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={createRecord.isPending}>
                Save record
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {records.length === 0 ? (
        <EmptyState title="No ownership records" description="Add owner details and billing responsibility per unit." />
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Card key={record.id}>
              <CardContent className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      Unit {record.unitIdentifier} — {record.ownerName}
                    </p>
                    {record.ownerEmail && (
                      <p className="text-sm text-muted-foreground">{record.ownerEmail}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(record.effectiveFrom)}
                      {record.effectiveTo ? ` → ${formatDate(record.effectiveTo)}` : " → present"}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    Bills: {billingLabels[record.billingResponsibility]}
                  </span>
                </div>
                {record.notes && <p className="mt-2 text-sm text-muted-foreground">{record.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
