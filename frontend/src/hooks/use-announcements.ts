"use client";

import { useQuery } from "@tanstack/react-query";
import { announcementsApi } from "@/lib/api/announcements";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";

export function useAnnouncements(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.announcements.list(orgId) : ["announcements", "disabled"],
    queryFn: () => announcementsApi.list(orgId!),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.liveOps,
    select: (data) =>
      [...data].sort(
        (a, b) =>
          new Date(b.publishedAt ?? b.createdAt).getTime() -
          new Date(a.publishedAt ?? a.createdAt).getTime(),
      ),
  });
}
