"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { useBillingRules, useUpsertBillingRule } from "@/hooks/use-billing-rules";
import { useOrganization } from "@/hooks/use-organization";
import type { BillingRule, UpsertBillingRuleInput } from "@/lib/api/billing-rules";
import { toast } from "sonner";

interface BillingRulesPanelProps {
  orgId: string;
}

export function BillingRulesPanel({ orgId }: BillingRulesPanelProps) {
  const { data: org } = useOrganization(orgId);
  const { data: rules, isLoading, isError, refetch } = useBillingRules(orgId);
  const upsert = useUpsertBillingRule(orgId);
  const isGated = org?.type === "GATED_COMMUNITY";

  const maintenanceRule = rules?.find((rule) => rule.chargeType === "MAINTENANCE");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("5");

  useEffect(() => {
    if (maintenanceRule) {
      setAmount(maintenanceRule.defaultAmount != null ? String(maintenanceRule.defaultAmount) : "");
      setDueDay(maintenanceRule.dueDayOfMonth != null ? String(maintenanceRule.dueDayOfMonth) : "5");
    }
  }, [maintenanceRule]);

  if (!isGated) return null;
  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  async function handleSave() {
    const parsedAmount = amount.trim() ? Number(amount) : undefined;
    const parsedDueDay = dueDay.trim() ? Number(dueDay) : undefined;
    if (parsedAmount !== undefined && (Number.isNaN(parsedAmount) || parsedAmount < 0)) {
      toast.error("Enter a valid maintenance amount");
      return;
    }
    if (parsedDueDay !== undefined && (Number.isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 28)) {
      toast.error("Due day must be between 1 and 28");
      return;
    }

    const input: UpsertBillingRuleInput = {
      chargeType: "MAINTENANCE",
      recurrence: "MONTHLY",
      defaultAmount: parsedAmount,
      dueDayOfMonth: parsedDueDay,
      appliesTo: maintenanceRule?.appliesTo ?? "ALL_ACTIVE_UNITS",
      billTo: maintenanceRule?.billTo ?? "OWNER",
      active: true,
    };

    try {
      await upsert.mutateAsync(input);
      toast.success("Billing rule saved");
    } catch {
      toast.error("Could not save billing rule");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Maintenance billing</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <p className="sm:col-span-2 text-sm text-muted-foreground">
          Monthly maintenance is generated per unit. Bill-to is resolved from unit ownership records
          and occupancy classification (owner vs tenant).
        </p>
        <div>
          <Label htmlFor="maintenanceAmount">Default amount (₹)</Label>
          <Input
            id="maintenanceAmount"
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="dueDay">Due day of month</Label>
          <Input
            id="dueDay"
            type="number"
            min={1}
            max={28}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
          />
        </div>
        {rules && rules.length > 0 && (
          <div className="sm:col-span-2 rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Active rules</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {rules.map((rule: BillingRule) => (
                <li key={rule.id}>
                  {rule.chargeType} — ₹{rule.defaultAmount ?? 0} on day {rule.dueDayOfMonth ?? 1},{" "}
                  bills {rule.billTo.toLowerCase()}, applies to{" "}
                  {rule.appliesTo === "ALL_ACTIVE_UNITS" ? "all units" : "occupied units only"}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="sm:col-span-2 flex justify-end">
          <Button disabled={upsert.isPending} onClick={() => void handleSave()}>
            Save maintenance rule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
