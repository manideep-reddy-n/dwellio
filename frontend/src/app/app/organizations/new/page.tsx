"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateOrganization } from "@/hooks/use-organization";
import type { OrganizationType } from "@/types/enums";
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
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [type, setType] = useState<OrganizationType>("HOSTEL");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !city.trim()) {
      toast.error("Name, slug, and city are required");
      return;
    }
    try {
      const org = await create.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
        type,
        city: city.trim(),
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
      <div className="mx-auto max-w-lg space-y-6">
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
              <div className="space-y-1">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
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
