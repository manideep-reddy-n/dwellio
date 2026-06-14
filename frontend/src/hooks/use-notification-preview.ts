"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";

/** Latest notifications for the header bell popover (max 3). */
export function useNotificationPreview() {
  const { authReady } = useAuthReady();

  const query = useQuery({
    queryKey: [...queryKeys.notifications.inbox(), "preview"],
    queryFn: () => notificationsApi.list({ page: 0, size: 3 }),
    enabled: authReady,
    staleTime: queryDefaults.staleTime.notifications,
  });

  return {
    notifications: query.data?.content ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
