import type { ComplaintStatus } from "@/types/enums";
import { cn } from "@/lib/utils";

const statusStyles: Record<ComplaintStatus, string> = {
  OPEN: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  IN_PROGRESS: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  RESOLVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CLOSED: "bg-muted text-muted-foreground",
  REOPENED: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
};

interface ComplaintStatusBadgeProps {
  status: ComplaintStatus;
  className?: string;
}

export function ComplaintStatusBadge({ status, className }: ComplaintStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        statusStyles[status],
        className,
      )}
    >
      {status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
    </span>
  );
}
