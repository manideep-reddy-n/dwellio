"use client";

import { useState } from "react";
import { NotificationInbox } from "@/components/notifications/notification-inbox";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InboxFilter = "all" | "unread";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<InboxFilter>("all");

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-muted-foreground">
            Your inbox stays in sync with the bell — no refresh needed.
          </p>
        </div>

        <div className="flex gap-2">
          {(["all", "unread"] as const).map((value) => (
            <Button
              key={value}
              variant={filter === value ? "secondary" : "outline"}
              size="sm"
              className={cn(filter === value && "pointer-events-none")}
              onClick={() => setFilter(value)}
            >
              {value === "all" ? "All" : "Unread"}
            </Button>
          ))}
        </div>

        <NotificationInbox unreadOnly={filter === "unread"} />
      </div>
    </PageTransition>
  );
}
