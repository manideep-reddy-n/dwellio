"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ComplaintStatusBadge } from "@/components/resident/complaint-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format/datetime";
import {
  complaintCategoryLabels,
  complaintPriorityLabels,
} from "@/lib/resident/labels";
import type { Complaint } from "@/types/api/complaint";
import { useUiStore } from "@/stores/ui-store";

interface ComplaintListProps {
  complaints: Complaint[] | undefined;
  isLoading?: boolean;
  orgSlug?: string;
  compact?: boolean;
  emptyMessage?: string;
}

export function ComplaintList({
  complaints,
  isLoading,
  orgSlug,
  compact,
  emptyMessage = "No complaints yet.",
}: ComplaintListProps) {
  const reducedMotion = useUiStore((s) => s.reducedMotion);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: compact ? 2 : 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!complaints?.length) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  const items = compact ? complaints.slice(0, 3) : complaints;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((complaint) => (
          <motion.div
            key={complaint.id}
            layout={!reducedMotion}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <ComplaintCard complaint={complaint} orgSlug={orgSlug} compact={compact} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ComplaintCard({
  complaint,
  orgSlug,
  compact,
}: {
  complaint: Complaint;
  orgSlug?: string;
  compact?: boolean;
}) {
  const reducedMotion = useUiStore((s) => s.reducedMotion);

  const content = (
    <Card className="transition-colors hover:bg-muted/40">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-sm font-medium">{complaint.title}</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {complaintCategoryLabels[complaint.category]} ·{" "}
            {complaintPriorityLabels[complaint.priority]} ·{" "}
            {formatRelativeTime(complaint.updatedAt)}
          </p>
        </div>
        <motion.div
          key={complaint.status}
          initial={reducedMotion ? false : { scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <ComplaintStatusBadge status={complaint.status} />
        </motion.div>
      </CardHeader>
      {!compact && (
        <CardContent className="pt-0">
          <p className="line-clamp-2 text-sm text-muted-foreground">{complaint.description}</p>
        </CardContent>
      )}
    </Card>
  );

  if (orgSlug && !complaint.id.startsWith("optimistic-")) {
    return (
      <Link href={`/app/${orgSlug}/resident/complaints`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export function ComplaintListFooter({ orgSlug }: { orgSlug: string }) {
  return (
    <Link
      href={`/app/${orgSlug}/resident/complaints`}
      className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline"
    >
      View all complaints
      <ChevronRight className="ml-0.5 size-4" />
    </Link>
  );
}
