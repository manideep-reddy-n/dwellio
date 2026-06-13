"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format/datetime";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/api/notification";
import { useUiStore } from "@/stores/ui-store";

interface NotificationRowProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  isMarking?: boolean;
}

function notificationHref(notification: Notification): string | null {
  const orgId = notification.organizationId;
  if (!orgId || !notification.payloadJson) return null;

  const slug = notification.payloadJson.organizationSlug;
  const orgSlug = typeof slug === "string" ? slug : null;

  switch (notification.type) {
    case "COMPLAINT_CREATED":
    case "COMPLAINT_ASSIGNED":
    case "COMPLAINT_RESOLVED":
    case "COMPLAINT_REOPENED":
      return orgSlug ? `/app/${orgSlug}/resident/complaints` : null;
    case "ANNOUNCEMENT_PUBLISHED":
      return orgSlug ? `/app/${orgSlug}/resident/announcements` : null;
    case "JOIN_REQUEST_APPROVED":
    case "JOIN_REQUEST_REJECTED":
      return "/app/organizations";
    default:
      return null;
  }
}

export function NotificationRow({ notification, onMarkRead, isMarking }: NotificationRowProps) {
  const reducedMotion = useUiStore((s) => s.reducedMotion);
  const isUnread = notification.status === "UNREAD";
  const href = notificationHref(notification);

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

  if (href) {
    return (
      <motion.li
        layout={!reducedMotion}
        className={cn(
          "transition-colors",
          isUnread && "bg-primary/5",
        )}
      >
        <Link
          href={href}
          className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30"
          onClick={() => {
            if (isUnread) onMarkRead(notification.id);
          }}
        >
          {inner}
        </Link>
      </motion.li>
    );
  }

  return (
    <motion.li
      layout={!reducedMotion}
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors",
        isUnread && "bg-primary/5",
      )}
    >
      {inner}
    </motion.li>
  );
}
