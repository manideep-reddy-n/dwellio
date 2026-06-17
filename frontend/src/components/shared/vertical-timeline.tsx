"use client";

import type { ActivityEvent, ActivityEventCategory } from "@/lib/api/timeline";
import { formatRelativeTime } from "@/lib/format/datetime";
import { cn } from "@/lib/utils";

const categoryStyles: Record<ActivityEventCategory, string> = {
  BILLING: "border-emerald-500 bg-emerald-50",
  ACCOMMODATION: "border-sky-500 bg-sky-50",
  COMPLAINT: "border-orange-500 bg-orange-50",
  REVIEW: "border-violet-500 bg-violet-50",
  MEMBERSHIP: "border-slate-400 bg-slate-50",
};

const dotStyles: Record<ActivityEventCategory, string> = {
  BILLING: "bg-emerald-500",
  ACCOMMODATION: "bg-sky-500",
  COMPLAINT: "bg-orange-500",
  REVIEW: "bg-violet-500",
  MEMBERSHIP: "bg-slate-400",
};

interface VerticalTimelineProps {
  events: ActivityEvent[];
  showResident?: boolean;
}

export function VerticalTimeline({ events, showResident }: VerticalTimelineProps) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  }

  return (
    <ol className="relative space-y-0 border-l border-border pl-6">
      {events.map((event, index) => (
        <li key={event.id} className={cn("relative pb-8", index === events.length - 1 && "pb-0")}>
          <span
            className={cn(
              "absolute -left-[1.6rem] top-1 size-3 rounded-full ring-4 ring-background",
              dotStyles[event.eventCategory],
            )}
          />
          <div className={cn("rounded-lg border-l-4 p-4", categoryStyles[event.eventCategory])}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{event.title}</p>
                {showResident && event.residentName && (
                  <p className="text-xs text-muted-foreground">{event.residentName}</p>
                )}
              </div>
              <time className="text-xs text-muted-foreground">
                {formatRelativeTime(event.occurredAt)}
              </time>
            </div>
            {event.description && (
              <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
