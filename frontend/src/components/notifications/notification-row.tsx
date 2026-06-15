"use client";

import { motion } from "framer-motion";
import { Bell, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format/datetime";
import { getNotificationHref } from "@/lib/notifications/routes";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/api/notification";
import { useUiStore } from "@/stores/ui-store";

interface NotificationRowProps {
  notification: Notification;
  onMarkRead: (id: string) => Promise<unknown>;
  isMarking?: boolean;
}

export function NotificationRow({ notification, onMarkRead, isMarking }: NotificationRowProps) {
  const router = useRouter();
  const reducedMotion = useUiStore((s) => s.reducedMotion);
  const isUnread = notification.status === "UNREAD";
  const href = getNotificationHref(notification);

  const inner = (
    <>
      <div
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
          isUnread ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <Bell className="size-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm", isUnread && "font-medium")}>{notification.title}</p>
          <time className="shrink-0 text-[10px] text-muted-foreground">
            {formatRelativeTime(notification.createdAt)}
          </time>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
      </div>

      {isUnread && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          title="Mark as read"
          disabled={isMarking}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkRead(notification.id);
          }}
        >
          <Check className="size-3.5" />
        </Button>
      )}
    </>
  );

  function navigate() {
    void (async () => {
      if (isUnread) {
        await onMarkRead(notification.id);
      }
      router.push(href ?? "/app/notifications");
    })();
  }

  return (
    <motion.li
      layout={!reducedMotion}
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/30",
        isUnread && "bg-primary/5",
      )}
      onClick={navigate}
    >
      <div className="flex items-start gap-3 px-4 py-3">{inner}</div>
    </motion.li>
  );
}
