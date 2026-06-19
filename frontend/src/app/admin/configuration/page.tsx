"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { adminPlatformApi, type PlatformSetting } from "@/lib/api/admin-platform";
import { toast } from "sonner";

export default function AdminConfigurationPage() {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const settings = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => adminPlatformApi.listSettings(),
  });

  const save = useMutation({
    mutationFn: ({ key, value }: { key: string; value: Record<string, unknown> }) =>
      adminPlatformApi.updateSetting(key, value),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Setting updated");
    },
    onError: () => toast.error("Could not save setting"),
  });

  if (settings.isError) return <ErrorState onRetry={() => void settings.refetch()} />;

  const grouped = (settings.data ?? []).reduce<Record<string, PlatformSetting[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuration</h1>
        <p className="mt-1 text-muted-foreground">
          Platform-wide settings for notifications, billing, complaints, verification, and marketplace.
        </p>
      </div>

      {settings.isLoading && <Skeleton className="h-48 w-full rounded-xl" />}

      {Object.entries(grouped).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-base capitalize">{category.replace(/_/g, " ")}</CardTitle>
            <CardDescription>Editable without code changes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items?.map((setting) => {
              const draft = drafts[setting.settingKey] ?? JSON.stringify(setting.valueJson, null, 2);
              return (
                <div key={setting.id} className="space-y-2 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{setting.settingKey}</p>
                    {setting.description && (
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={setting.settingKey} className="text-xs">
                      JSON value
                    </Label>
                    <textarea
                      id={setting.settingKey}
                      className="min-h-[88px] w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                      value={draft}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [setting.settingKey]: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={save.isPending}
                    onClick={() => {
                      try {
                        const value = JSON.parse(draft) as Record<string, unknown>;
                        save.mutate({ key: setting.settingKey, value });
                      } catch {
                        toast.error("Invalid JSON");
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
