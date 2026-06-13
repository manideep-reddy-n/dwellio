"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";
import { useNotificationStore } from "@/stores/notification-store";

export function useUnreadNotificationCount() {
  const { authReady } = useAuthReady();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const { data } = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsApi.unreadCount(),
    enabled: authReady,
    staleTime: queryDefaults.staleTime.notifications,
    refetchInterval: authReady ? 60_000 : false,
  });

  useEffect(() => {
    if (data != null) {
      setUnreadCount(data.unreadCount);
    }
  }, [data, setUnreadCount]);

  return unreadCount;
}
