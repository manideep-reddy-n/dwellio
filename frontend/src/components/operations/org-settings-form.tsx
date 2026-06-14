"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/shared/error-state";
import { LocationPicker, type LocationValue } from "@/components/maps/location-picker";
import { useOrganization, useUpdateOrganization, useUploadOrganizationLogo } from "@/hooks/use-organization";
import { organizationImagesApi } from "@/lib/api/organizations";
import { apiConfig } from "@/config/api";
import type { Organization } from "@/types/api/organization";
import { resolveMediaUrl } from "@/lib/media/resolve-url";
import { toast } from "sonner";

interface OrgSettingsFormProps {
  orgId: string;
}

export function OrgSettingsForm({ orgId }: OrgSettingsFormProps) {
  const { data: org, isLoading, isError, refetch } = useOrganization(orgId);
  const update = useUpdateOrganization(orgId);
  const uploadLogo = useUploadOrganizationLogo(orgId);
  const queryClient = useQueryClient();
  const { data: images = [] } = useQuery({
    queryKey: ["org-images", orgId],
    queryFn: () => organizationImagesApi.list(orgId),
  });
  const uploadImage = useMutation({
    mutationFn: (file: File) => organizationImagesApi.upload(orgId, file),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["org-images", orgId] }),
  });
  const [form, setForm] = useState<Partial<Organization>>({});
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [defaultRent, setDefaultRent] = useState("");

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
      setDefaultRent(org.defaultMonthlyRent != null ? String(org.defaultMonthlyRent) : "");
      if (org.latitude != null && org.longitude != null) {
        setLocation({
          latitude: org.latitude,
          longitude: org.longitude,
          city: org.city,
          area: org.area ?? undefined,
          state: org.state ?? undefined,
          postalCode: org.postalCode ?? undefined,
          addressLine: org.addressLine ?? undefined,
        });
      }
    }
  }, [org]);

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (isError || !org) return <ErrorState onRetry={() => void refetch()} />;

  async function handleSave() {
    const rent = defaultRent.trim() ? Number(defaultRent) : undefined;
    if (rent !== undefined && (Number.isNaN(rent) || rent < 0)) {
      toast.error("Enter a valid default monthly rent");
      return;
    }
    try {
      await update.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        city: form.city,
        area: form.area || undefined,
        state: form.state || undefined,
        postalCode: form.postalCode || undefined,
        addressLine: form.addressLine || undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
        contactPhone: form.contactPhone || undefined,
        contactEmail: form.contactEmail || undefined,
        defaultMonthlyRent: rent,
      });
      toast.success("Organization updated");
    } catch {
      toast.error("Could not update organization");
    }
  }

  async function handleLogoChange(file: File | undefined) {
    if (!file) return;
    try {
      await uploadLogo.mutateAsync(file);
      toast.success("Logo uploaded");
    } catch {
      toast.error("Could not upload logo");
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

  const logoSrc = resolveMediaUrl(org.logoUrl);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing & branding</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="defaultRent">Default monthly rent (₹)</Label>
            <Input
              id="defaultRent"
              type="number"
              min={0}
              value={defaultRent}
              onChange={(e) => setDefaultRent(e.target.value)}
              placeholder="Used when allocating residents without a custom rent"
            />
          </div>
          <div>
            <Label htmlFor="logo">Organization logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-1"
              onChange={(e) => void handleLogoChange(e.target.files?.[0])}
            />
            {logoSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="Organization logo" className="mt-2 h-16 w-auto rounded border" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              uploadImage.mutate(file, {
                onSuccess: () => toast.success("Image uploaded"),
                onError: () => toast.error("Could not upload image"),
              });
            }}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {images.map((img) => (
              <div key={img.id} className="overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url.startsWith("http") ? img.url : `${apiConfig.baseUrl.replace(/\/api\/v1\/?$/, "")}${img.url}`}
                  alt={img.caption ?? "Property"}
                  className="aspect-video w-full object-cover"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
          <div className="sm:col-span-2">
            <Label className="mb-2 block">Map location</Label>
            <p className="mb-3 text-xs text-muted-foreground">
              Search for a place, drag the marker, or enter coordinates manually. Shown on your public
              profile and explore map.
            </p>
            <LocationPicker
              value={location}
              onChange={setLocation}
              onAddressFields={(fields) =>
                setForm((f) => ({
                  ...f,
                  city: fields.city ?? f.city,
                  area: fields.area ?? f.area,
                  state: fields.state ?? f.state,
                  postalCode: fields.postalCode ?? f.postalCode,
                  addressLine: fields.addressLine ?? f.addressLine,
                }))
              }
            />
          </div>
          {field("contactPhone", "Contact phone")}
          {field("contactEmail", "Contact email")}
          <div className="sm:col-span-2 flex justify-end">
            <Button disabled={update.isPending} onClick={() => void handleSave()}>
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
