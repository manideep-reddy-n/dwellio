"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OrganizationType } from "@/types/enums";
import { orgTypeLabels } from "@/lib/marketplace/format";

const orgTypes = Object.keys(orgTypeLabels) as OrganizationType[];

export function ExploreFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const city = searchParams.get("city") ?? "";
  const type = searchParams.get("type") ?? "";
  const q = searchParams.get("q") ?? "";

  const apply = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      router.push(`/explore?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <form
      className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        apply({
          q: String(form.get("q") ?? ""),
          city: String(form.get("city") ?? ""),
          type: String(form.get("type") ?? ""),
        });
      }}
    >
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="q">Search</Label>
        <Input id="q" name="q" defaultValue={q} placeholder="Name, city, or area" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" defaultValue={city} placeholder="Hyderabad" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          defaultValue={type}
          className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">All types</option>
          {orgTypes.map((value) => (
            <option key={value} value={value}>
              {orgTypeLabels[value]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end sm:col-span-2 lg:col-span-4">
        <Button type="submit" className="w-full sm:w-auto">Search</Button>
      </div>
    </form>
  );
}
