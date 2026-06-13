"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/shared/error-state";
import { useOrganization, useUpdateOrganization } from "@/hooks/use-organization";
import type { Organization } from "@/types/api/organization";
import { toast } from "sonner";

interface OrgSettingsFormProps {
  orgId: string;
}

export function OrgSettingsForm({ orgId }: OrgSettingsFormProps) {
  const { data: org, isLoading, isError, refetch } = useOrganization(orgId);
  const update = useUpdateOrganization(orgId);
  const [form, setForm] = useState<Partial<Organization>>({});

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name,
        description: org.description ?? "",
        city: org.city,
        area: org.area ?? "",
        state: org.state ?? "",
        postalCode: org.postalCode ?? "",
        addressLine: org.addressLine ?? "",
        contactPhone: org.contactPhone ?? "",
        contactEmail: org.contactEmail ?? "",
      });
    }
  }, [org]);

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (isError || !org) return <ErrorState onRetry={() => void refetch()} />;

  async function handleSave() {
    try {
      await update.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        city: form.city,
        area: form.area || undefined,
        state: form.state || undefined,
        postalCode: form.postalCode || undefined,
        addressLine: form.addressLine || undefined,
        contactPhone: form.contactPhone || undefined,
        contactEmail: form.contactEmail || undefined,
      });
      toast.success("Organization updated");
    } catch {
      toast.error("Could not update organization");
    }
  }

  const field = (key: keyof typeof form, label: string, multiline?: boolean) => (
    <div className="space-y-1">
      <Label htmlFor={key}>{label}</Label>
      {multiline ? (
        <Textarea
          id={key}
          rows={3}
          value={(form[key] as string) ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      ) : (
        <Input
          id={key}
          value={(form[key] as string) ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Organization profile</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {field("name", "Name")}
        {field("city", "City")}
        <div className="sm:col-span-2">{field("description", "Description", true)}</div>
        {field("area", "Area")}
        {field("state", "State")}
        {field("postalCode", "Postal code")}
        <div className="sm:col-span-2">{field("addressLine", "Address")}</div>
        {field("contactPhone", "Contact phone")}
        {field("contactEmail", "Contact email")}
        <div className="sm:col-span-2 flex justify-end">
          <Button disabled={update.isPending} onClick={() => void handleSave()}>
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
