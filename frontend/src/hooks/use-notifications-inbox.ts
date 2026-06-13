"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";
import { useNotificationStore } from "@/stores/notification-store";
import type { Notification, PagedNotifications } from "@/types/api/notification";
import type { NotificationListParams } from "@/lib/api/notifications";
import { useAuthReady } from "@/hooks/use-auth-ready";

const PAGE_SIZE = 20;

export function useNotificationInbox(params: Omit<NotificationListParams, "page" | "size"> = {}) {
  const { authReady } = useAuthReady();

  return useInfiniteQuery({
    queryKey: queryKeys.notifications.inbox(params),
    queryFn: ({ pageParam }) =>
      notificationsApi.list({ ...params, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (last: PagedNotifications) =>
      last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    enabled: authReady,
    staleTime: queryDefaults.staleTime.notifications,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.inbox() });

      const previousPages = queryClient.getQueriesData<{ pages: PagedNotifications[] }>({
        queryKey: queryKeys.notifications.inbox(),
      });

      queryClient.setQueriesData<{ pages: PagedNotifications[]; pageParams: unknown[] }>(
        { queryKey: queryKeys.notifications.inbox() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              content: page.content.map((n) =>
                n.id === notificationId
                  ? { ...n, status: "READ" as const, readAt: new Date().toISOString() }
                  : n,
              ),
            })),
          };
        },
      );

      const wasUnread = previousPages.some(([, data]) =>
        data?.pages.some((p) =>
          p.content.some((n) => n.id === notificationId && n.status === "UNREAD"),
        ),
      );

      if (wasUnread) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }

      return { previousPages, wasUnread };
    },
    onError: (_err, _id, context) => {
      context?.previousPages.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.inbox() });

      const previousPages = queryClient.getQueriesData<{ pages: PagedNotifications[] }>({
        queryKey: queryKeys.notifications.inbox(),
      });

      queryClient.setQueriesData<{ pages: PagedNotifications[]; pageParams: unknown[] }>(
        { queryKey: queryKeys.notifications.inbox() },
        (old) => {
          if (!old) return old;
          const now = new Date().toISOString();
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              content: page.content.map((n) =>
                n.status === "UNREAD" ? { ...n, status: "READ" as const, readAt: now } : n,
              ),
            })),
          };
        },
      );

      setUnreadCount(0);
      return { previousPages };
    },
    onError: (_err, _vars, context) => {
      context?.previousPages.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.inbox() });
    },
  });
}

export function flattenNotifications(
  data: { pages: PagedNotifications[] } | undefined,
): Notification[] {
  if (!data) return [];
  return data.pages.flatMap((p) => p.content);
}
