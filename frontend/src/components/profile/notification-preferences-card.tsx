"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  notificationPreferencesApi,
  type NotificationPreferenceCategory,
} from "@/lib/api/push";
import { registerBrowserPush, unregisterBrowserPush } from "@/lib/push/register-push";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<NotificationPreferenceCategory, string> = {
  COMPLAINTS: "Complaints",
  PAYMENTS: "Payments",
  ANNOUNCEMENTS: "Announcements",
  REVIEWS: "Reviews",
  MEMBERSHIP: "Membership",
  SYSTEM: "System",
};

export function NotificationPreferencesCard() {
  const queryClient = useQueryClient();
  const [pushBusy, setPushBusy] = useState(false);

  const prefs = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => notificationPreferencesApi.list(),
  });

  const updatePref = useMutation({
    mutationFn: ({
      category,
      patch,
    }: {
      category: NotificationPreferenceCategory;
      patch: { inAppEnabled?: boolean; pushEnabled?: boolean; emailEnabled?: boolean };
    }) => notificationPreferencesApi.update(category, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
    onError: () => toast.error("Could not update preference"),
  });

  const enablePush = async () => {
    setPushBusy(true);
    try {
      const ok = await registerBrowserPush();
      if (ok) toast.success("Browser push notifications enabled");
      else toast.error("Push notifications are not available");
    } catch {
      toast.error("Could not enable push notifications");
    } finally {
      setPushBusy(false);
    }
  };

  const disablePush = async () => {
    setPushBusy(true);
    try {
      await unregisterBrowserPush();
      toast.success("Browser push disabled");
    } catch {
      toast.error("Could not disable push");
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notification preferences</CardTitle>
        <CardDescription>Control in-app, browser push, and email channels per category.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="gap-1.5" disabled={pushBusy} onClick={() => void enablePush()}>
            <Bell className="size-4" />
            Enable browser push
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={pushBusy}
            onClick={() => void disablePush()}
          >
            <BellOff className="size-4" />
            Disable browser push
          </Button>
        </div>

        {prefs.isLoading && <p className="text-sm text-muted-foreground">Loading preferences…</p>}

        <div className="space-y-3">
          {prefs.data?.map((pref) => (
            <div key={pref.category} className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-medium">{CATEGORY_LABELS[pref.category]}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`${pref.category}-in-app`} className="text-xs">
                    In-app
                  </Label>
                  <input
                    id={`${pref.category}-in-app`}
                    type="checkbox"
                    className="size-4 accent-teal-600"
                    checked={pref.inAppEnabled}
                    onChange={(e) =>
                      updatePref.mutate({ category: pref.category, patch: { inAppEnabled: e.target.checked } })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`${pref.category}-push`} className="text-xs">
                    Browser push
                  </Label>
                  <input
                    id={`${pref.category}-push`}
                    type="checkbox"
                    className="size-4 accent-teal-600"
                    checked={pref.pushEnabled}
                    onChange={(e) =>
                      updatePref.mutate({ category: pref.category, patch: { pushEnabled: e.target.checked } })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`${pref.category}-email`} className="text-xs text-muted-foreground">
                    Email (soon)
                  </Label>
                  <input
                    id={`${pref.category}-email`}
                    type="checkbox"
                    className="size-4 accent-teal-600"
                    checked={pref.emailEnabled}
                    disabled
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
