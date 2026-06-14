"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationPicker, type LocationValue } from "@/components/maps/location-picker";
import { DEFAULT_MAP_CENTER } from "@/lib/maps/geocoding";
import { useCreateOrganization } from "@/hooks/use-organization";
import { useMyMemberships } from "@/hooks/use-memberships";
import { canCreateOrganization, resolveAppHome } from "@/lib/navigation/app-routing";
import { isHostelType } from "@/lib/copy/home-messaging";
import type { HostelAudience, OrganizationType } from "@/types/enums";
import { toast } from "sonner";

const orgTypes: OrganizationType[] = [
  "HOSTEL",
  "PG",
  "CO_LIVING",
  "GATED_COMMUNITY",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewOrganizationPage() {
  const router = useRouter();
  const create = useCreateOrganization();
  const { data: memberships = [], isLoading } = useMyMemberships();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [type, setType] = useState<OrganizationType>("HOSTEL");
  const [hostelAudience, setHostelAudience] = useState<HostelAudience>("CO_ED");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [location, setLocation] = useState<LocationValue>({
    latitude: DEFAULT_MAP_CENTER.lat,
    longitude: DEFAULT_MAP_CENTER.lng,
  });
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!canCreateOrganization(memberships)) {
      router.replace(resolveAppHome(memberships));
    }
  }, [isLoading, memberships, router]);

  if (isLoading || !canCreateOrganization(memberships)) {
    return (
      <PageTransition>
        <Skeleton className="mx-auto h-64 max-w-lg rounded-xl" />
      </PageTransition>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !city.trim()) {
      toast.error("Name, slug, and city are required");
      return;
    }
    if (isHostelType(type) && !hostelAudience) {
      toast.error("Select whether the hostel/PG is for boys, girls, or co-ed");
      return;
    }
    try {
      const org = await create.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
        type,
        hostelAudience: isHostelType(type) ? hostelAudience : undefined,
        city: city.trim(),
        area: area.trim() || undefined,
        addressLine: addressLine.trim() || undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        description: description.trim() || undefined,
      });
      toast.success("Organization created");
      router.push(`/app/${org.slug}/operations`);
    } catch {
      toast.error("Could not create organization");
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create organization</h1>
          <p className="mt-1 text-muted-foreground">
            Set up a new property on Dwellio. You will be the owner.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="slug">URL slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="flex h-9 w-full rounded-lg border bg-background px-3 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value as OrganizationType)}
                >
                  {orgTypes.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              {isHostelType(type) && (
                <div className="space-y-1">
                  <Label htmlFor="audience">Who can stay here?</Label>
                  <select
                    id="audience"
                    className="flex h-9 w-full rounded-lg border bg-background px-3 text-sm"
                    value={hostelAudience}
                    onChange={(e) => setHostelAudience(e.target.value as HostelAudience)}
                  >
                    <option value="BOYS">Boys only</option>
                    <option value="GIRLS">Girls only</option>
                    <option value="CO_ED">Co-ed (boys & girls)</option>
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="area">Area / locality</Label>
                <Input id="area" value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">Street address</Label>
                <Input
                  id="address"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                />
              </div>

              <LocationPicker
                value={location}
                onChange={setLocation}
                onAddressFields={(fields) => {
                  if (fields.city) setCity(fields.city);
                  if (fields.area) setArea(fields.area);
                  if (fields.addressLine) setAddressLine(fields.addressLine);
                }}
              />

              <div className="space-y-1">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending}>
                Create organization
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
