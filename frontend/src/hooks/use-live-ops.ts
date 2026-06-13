"use client";

import { useQuery } from "@tanstack/react-query";
import { announcementsApi } from "@/lib/api/announcements";
import { complaintsApi } from "@/lib/api/complaints";
import { joinRequestsApi } from "@/lib/api/join-requests";
import { occupanciesApi } from "@/lib/api/accommodation";
import { dashboardApi } from "@/lib/api/dashboard";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";

export function useLiveOps(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.liveOps(orgId) : ["live-ops", "disabled"],
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.liveOps,
    queryFn: async () => {
      const [metrics, complaints, announcements, joinRequests, occupancies] = await Promise.all([
        dashboardApi.get(orgId!),
        complaintsApi.listAll(orgId!),
        announcementsApi.list(orgId!),
        joinRequestsApi.list(orgId!),
        occupanciesApi.list(orgId!),
      ]);

      return {
        metrics,
        complaints: complaints
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 8),
        announcements: announcements
          .filter((a) => a.published)
          .sort(
            (a, b) =>
              new Date(b.publishedAt ?? b.createdAt).getTime() -
              new Date(a.publishedAt ?? a.createdAt).getTime(),
          )
          .slice(0, 5),
        joinRequests: joinRequests
          .filter((j) => j.status === "PENDING")
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5),
        occupancies: occupancies
          .filter((o) => o.current)
          .sort((a, b) => new Date(b.moveInDate).getTime() - new Date(a.moveInDate).getTime())
          .slice(0, 6),
      };
    },
  });
}
