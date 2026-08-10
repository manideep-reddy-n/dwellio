"use client";

import { useMemo } from "react";
import { Building2, History } from "lucide-react";
import { PageTransition } from "@/components/shared/page-transition";
import { PageTitle } from "@/components/shared/page-title";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAllMyTimeline } from "@/hooks/use-timeline";
import type { ActivityEvent, ActivityEventCategory } from "@/lib/api/timeline";
import { formatRelativeTime } from "@/lib/format/datetime";
import { cn } from "@/lib/utils";

const categoryStyles: Record<ActivityEventCategory, string> = {
  BILLING: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
  ACCOMMODATION: "border-sky-500 bg-sky-50 dark:bg-sky-950/30",
  COMPLAINT: "border-orange-500 bg-orange-50 dark:bg-orange-950/30",
  REVIEW: "border-violet-500 bg-violet-50 dark:bg-violet-950/30",
  MEMBERSHIP: "border-slate-400 bg-slate-50 dark:bg-slate-900/30",
};

const dotStyles: Record<ActivityEventCategory, string> = {
  BILLING: "bg-emerald-500",
  ACCOMMODATION: "bg-sky-500",
  COMPLAINT: "bg-orange-500",
  REVIEW: "bg-violet-500",
  MEMBERSHIP: "bg-slate-400",
};

const categoryLabel: Record<ActivityEventCategory, string> = {
  BILLING: "Billing",
  ACCOMMODATION: "Accommodation",
  COMPLAINT: "Complaint",
  REVIEW: "Review",
  MEMBERSHIP: "Membership",
};

export default function GlobalTimelinePage() {
  const { data = [], isLoading, isError, refetch } = useAllMyTimeline();

  // Group events by organizationSlug for sectioned display
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; events: ActivityEvent[] }>();
    for (const event of data) {
      const key = event.organizationSlug;
      if (!map.has(key)) {
        map.set(key, { name: event.organizationName, slug: event.organizationSlug, events: [] });
      }
      map.get(key)!.events.push(event);
    }
    return Array.from(map.values());
  }, [data]);

  return (
    <PageTransition>
      <PageTitle title="My full timeline" />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <History className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">My full timeline</h1>
            <p className="text-sm text-muted-foreground">
              Your complete activity history across all organizations you&apos;ve ever been part of.
            </p>
          </div>
        </div>

        {isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : isLoading ? (
          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No activity recorded yet. Activity appears here as you use Dwellio.
          </p>
        ) : (
          <div className="mt-6 space-y-10">
            {grouped.map((group) => (
              <section key={group.slug}>
                <div className="mb-4 flex items-center gap-2.5">
                  <Building2 className="size-4 shrink-0 text-teal-600" />
                  <h2 className="font-semibold">{group.name}</h2>
                  <span className="text-xs text-muted-foreground">
                    {group.events.length} event{group.events.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <ol className="relative space-y-0 border-l border-border pl-6">
                  {group.events.map((event, index) => (
                    <li
                      key={event.id}
                      className={cn("relative pb-6", index === group.events.length - 1 && "pb-0")}
                    >
                      <span
                        className={cn(
                          "absolute -left-[1.6rem] top-1 size-3 rounded-full ring-4 ring-background",
                          dotStyles[event.eventCategory],
                        )}
                      />
                      <div
                        className={cn(
                          "rounded-lg border-l-4 p-3.5",
                          categoryStyles[event.eventCategory],
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium leading-snug">{event.title}</p>
                            <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0">
                              {categoryLabel[event.eventCategory]}
                            </Badge>
                          </div>
                          <time className="shrink-0 text-xs text-muted-foreground">
                            {formatRelativeTime(event.occurredAt)}
                          </time>
                        </div>
                        {event.description && (
                          <p className="mt-1.5 text-sm text-muted-foreground">{event.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
