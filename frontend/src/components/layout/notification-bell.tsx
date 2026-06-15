"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/hooks/use-notifications-inbox";
import { useNotificationPreview } from "@/hooks/use-notification-preview";
import { useUnreadNotificationCount } from "@/hooks/use-unread-notifications";
import { formatRelativeTime } from "@/lib/format/datetime";
import { getNotificationHref } from "@/lib/notifications/routes";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const router = useRouter();
  const unreadCount = useUnreadNotificationCount();
  const { notifications, isLoading } = useNotificationPreview();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "relative")}
        title="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 size-4 justify-center p-0 text-[10px]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between gap-2">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={markAllRead.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  void markAllRead.mutateAsync();
                }}
              >
                <CheckCheck className="size-3" />
                Mark all read
              </Button>
            )}
          </DropdownMenuLabel>
          {isLoading && (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">Loading…</div>
          )}
          {!isLoading && notifications.length === 0 && (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">
              No notifications yet
            </div>
          )}
          {notifications.map((notification) => {
            const href = getNotificationHref(notification);
            return (
              <DropdownMenuItem
                key={notification.id}
                className="flex cursor-pointer flex-col items-start gap-0.5 py-2"
                onClick={() => {
                  void (async () => {
                    if (notification.status === "UNREAD") {
                      await markRead.mutateAsync(notification.id);
                    }
                    router.push(href ?? "/app/notifications");
                  })();
                }}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span
                    className={cn(
                      "line-clamp-1 text-sm",
                      notification.status === "UNREAD" && "font-medium",
                    )}
                  >
                    {notification.title}
                  </span>
                  <time className="shrink-0 text-[10px] text-muted-foreground">
                    {formatRelativeTime(notification.createdAt)}
                  </time>
                </div>
                <span className="line-clamp-2 text-xs text-muted-foreground">{notification.body}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="p-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => router.push("/app/notifications")}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
