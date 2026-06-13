"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssetMutations } from "@/hooks/use-assets";
import { formatRelativeTime } from "@/lib/format/datetime";
import type { Asset, AssetStatus } from "@/types/api/asset";
import { toast } from "sonner";

const statuses: AssetStatus[] = ["OPERATIONAL", "MAINTENANCE", "OUT_OF_SERVICE", "RETIRED"];

interface AssetManagerProps {
  orgId: string;
  assets: Asset[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function AssetManager({ orgId, assets, isLoading, isError, onRetry }: AssetManagerProps) {
  const { create, update, remove } = useAssetMutations(orgId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (isError) return <ErrorState onRetry={onRetry} />;

  async function handleCreate() {
    if (!name.trim() || !category.trim()) {
      toast.error("Name and category are required");
      return;
    }
    try {
      await create.mutateAsync({ name: name.trim(), category: category.trim() });
      toast.success("Asset created");
      setOpen(false);
      setName("");
      setCategory("");
    } catch {
      toast.error("Could not create asset");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="gap-2" />}>
            <Plus className="size-4" />
            Add asset
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="asset-name">Name</Label>
                <Input id="asset-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="asset-cat">Category</Label>
                <Input
                  id="asset-cat"
                  placeholder="HVAC, Furniture, Appliance…"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button disabled={create.isPending} onClick={() => void handleCreate()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!assets?.length ? (
        <EmptyState title="No assets" description="Track equipment and fixtures across your property." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {assets.map((asset) => (
            <Card key={asset.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-base">{asset.name}</CardTitle>
                <Badge variant="outline">{asset.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-sm text-muted-foreground">{asset.category}</p>
                <p className="text-xs text-muted-foreground">
                  Updated {formatRelativeTime(asset.updatedAt)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    value={asset.status}
                    onChange={(e) =>
                      update.mutate({
                        id: asset.id,
                        input: { status: e.target.value as AssetStatus },
                      })
                    }
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(asset.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
