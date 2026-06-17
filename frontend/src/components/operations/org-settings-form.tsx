"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
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
  const deleteImage = useMutation({
    mutationFn: (imageId: string) => organizationImagesApi.delete(orgId, imageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["org-images", orgId] });
      toast.success("Photo removed");
    },
    onError: () => toast.error("Could not remove photo"),
  });
  const [form, setForm] = useState<Partial<Organization>>({});
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [defaultRent, setDefaultRent] = useState("");
  const [slaFirstResponseHours, setSlaFirstResponseHours] = useState("");
  const [slaResolutionHours, setSlaResolutionHours] = useState("");
  const [billingMode, setBillingMode] = useState<Organization["billingMode"]>("OCCUPANCY_ANCHOR");
  const [billingCustomDay, setBillingCustomDay] = useState("");

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
      setSlaFirstResponseHours(String(org.slaFirstResponseHours ?? 24));
      setSlaResolutionHours(String(org.slaResolutionHours ?? 72));
      setBillingMode(org.billingMode ?? "OCCUPANCY_ANCHOR");
      setBillingCustomDay(org.billingCustomDay != null ? String(org.billingCustomDay) : "");
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
    const firstResponse = slaFirstResponseHours.trim() ? Number(slaFirstResponseHours) : undefined;
    const resolution = slaResolutionHours.trim() ? Number(slaResolutionHours) : undefined;
    const customDay = billingCustomDay.trim() ? Number(billingCustomDay) : undefined;
    if (rent !== undefined && (Number.isNaN(rent) || rent < 0)) {
      toast.error("Enter a valid default monthly rent");
      return;
    }
    if (firstResponse !== undefined && (Number.isNaN(firstResponse) || firstResponse <= 0)) {
      toast.error("Enter a valid first-response SLA (hours)");
      return;
    }
    if (resolution !== undefined && (Number.isNaN(resolution) || resolution <= 0)) {
      toast.error("Enter a valid resolution SLA (hours)");
      return;
    }
    if (customDay !== undefined && (Number.isNaN(customDay) || customDay < 1 || customDay > 28)) {
      toast.error("Billing custom day must be between 1 and 28");
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
        slaFirstResponseHours: firstResponse,
        slaResolutionHours: resolution,
        billingMode,
        billingCustomDay: customDay,
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

  async function handlePhotosUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    let uploaded = 0;

    for (const file of files) {
      try {
        await uploadImage.mutateAsync(file);
        uploaded += 1;
      } catch {
        // continue with remaining files
      }
    }

    if (uploaded === files.length) {
      toast.success(uploaded === 1 ? "Photo uploaded" : `${uploaded} photos uploaded`);
    } else if (uploaded > 0) {
      toast.warning(`${uploaded} of ${files.length} photos uploaded`);
    } else {
      toast.error("Could not upload photos");
    }
  }

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
          <CardTitle className="text-base">Complaint SLA</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="slaFirstResponse">First response target (hours)</Label>
            <Input
              id="slaFirstResponse"
              type="number"
              min={0.01}
              step={0.5}
              value={slaFirstResponseHours}
              onChange={(e) => setSlaFirstResponseHours(e.target.value)}
              placeholder="24"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Maximum hours before staff must acknowledge a new complaint.
            </p>
          </div>
          <div>
            <Label htmlFor="slaResolution">Resolution target (hours)</Label>
            <Input
              id="slaResolution"
              type="number"
              min={0.01}
              step={0.5}
              value={slaResolutionHours}
              onChange={(e) => setSlaResolutionHours(e.target.value)}
              placeholder="72"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Maximum hours to resolve an open complaint.
            </p>
          </div>
        </CardContent>
      </Card>

      {org.type === "GATED_COMMUNITY" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Billing cycle</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="billingMode">Billing mode</Label>
              <select
                id="billingMode"
                className="mt-1 flex h-9 w-full rounded-lg border bg-background px-3 text-sm"
                value={billingMode}
                onChange={(e) =>
                  setBillingMode(e.target.value as Organization["billingMode"])
                }
              >
                <option value="CALENDAR_MONTH">Calendar month (fixed due day)</option>
                <option value="OCCUPANCY_ANCHOR">Occupancy anchor (move-in anniversary)</option>
                <option value="CUSTOM_DAY">Custom day each month</option>
              </select>
            </div>
            {billingMode === "CUSTOM_DAY" && (
              <div>
                <Label htmlFor="billingCustomDay">Custom due day</Label>
                <Input
                  id="billingCustomDay"
                  type="number"
                  min={1}
                  max={28}
                  value={billingCustomDay}
                  onChange={(e) => setBillingCustomDay(e.target.value)}
                  placeholder="e.g. 15"
                />
              </div>
            )}
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              Controls when monthly maintenance charges are due. Maintenance amounts are configured
              under Payments.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Upload photos of rooms, common areas, and amenities. They appear on your public explore
            listing and organization profile for everyone browsing Dwellio.
          </p>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploadImage.isPending}
            onChange={(e) => {
              void handlePhotosUpload(e.target.files);
              e.target.value = "";
            }}
          />
          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {images.map((img) => {
                const src = resolveMediaUrl(img.url);
                if (!src) return null;
                return (
                  <div key={img.id} className="group relative overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={img.caption ?? "Property"}
                      className="aspect-video w-full object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute right-2 top-2 size-8 opacity-0 transition-opacity group-hover:opacity-100"
                      disabled={deleteImage.isPending}
                      onClick={() => deleteImage.mutate(img.id)}
                      aria-label="Remove photo"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              No photos yet. Add a few to help residents discover your property.
            </p>
          )}
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
