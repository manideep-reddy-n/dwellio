"use client";

import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationRow } from "@/components/notifications/notification-row";
import {
  flattenNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationInbox,
} from "@/hooks/use-notifications-inbox";
import { useOrgStore } from "@/stores/org-store";

interface NotificationInboxProps {
  organizationFilter?: boolean;
  unreadOnly?: boolean;
}

export function NotificationInbox({
  organizationFilter = false,
  unreadOnly = false,
}: NotificationInboxProps) {
  const activeOrgId = useOrgStore((s) => s.activeOrg?.id);
  const params = {
    ...(organizationFilter && activeOrgId ? { organizationId: activeOrgId } : {}),
    unreadOnly,
  };

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useNotificationInbox(params);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = flattenNotifications(data);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {notifications.length === 0
            ? "You're all caught up."
            : `${notifications.length} notification${notifications.length === 1 ? "" : "s"}`}
        </p>
        {notifications.some((n) => n.status === "UNREAD") && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void markAllRead.mutateAsync()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="size-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No notifications to show.
          {unreadOnly && (
            <>
              {" "}
              <Link href="/app/notifications" className="text-primary hover:underline">
                View all
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkRead={(id) => markRead.mutate(id)}
              isMarking={markRead.isPending && markRead.variables === notification.id}
            />
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
