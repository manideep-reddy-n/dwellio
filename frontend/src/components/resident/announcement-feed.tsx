"use client";

import { motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format/datetime";
import { announcementTypeLabels } from "@/lib/resident/labels";
import type { Announcement } from "@/types/api/announcement";
import { useUiStore } from "@/stores/ui-store";

interface AnnouncementFeedProps {
  announcements: Announcement[] | undefined;
  isLoading?: boolean;
  compact?: boolean;
  emptyMessage?: string;
}

export function AnnouncementFeed({
  announcements,
  isLoading,
  compact,
  emptyMessage = "No announcements yet.",
}: AnnouncementFeedProps) {
  const reducedMotion = useUiStore((s) => s.reducedMotion);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: compact ? 2 : 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!announcements?.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const items = compact ? announcements.slice(0, 3) : announcements;

  return (
    <div className="space-y-3">
      {items.map((announcement, index) => (
        <motion.div
          key={announcement.id}
          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reducedMotion ? 0 : index * 0.04 }}
        >
          <AnnouncementCard announcement={announcement} compact={compact} />
        </motion.div>
      ))}
    </div>
  );
}

function AnnouncementCard({
  announcement,
  compact,
}: {
  announcement: Announcement;
  compact?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Megaphone className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-sm font-medium">{announcement.title}</CardTitle>
            <Badge variant="secondary" className="text-[10px]">
              {announcementTypeLabels[announcement.type]}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatRelativeTime(announcement.publishedAt ?? announcement.createdAt)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className={compact ? "line-clamp-2 text-sm text-muted-foreground" : "text-sm whitespace-pre-wrap"}>
          {announcement.content}
        </p>
      </CardContent>
    </Card>
  );
}
