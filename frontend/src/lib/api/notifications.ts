import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { Notification, PagedNotifications } from "@/types/api/notification";

const base = apiConfig.baseUrl;

export interface UnreadNotificationCountResponse {
  unreadCount: number;
}

export interface NotificationListParams {
  organizationId?: string;
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}

function buildQuery(params: NotificationListParams): string {
  const search = new URLSearchParams();
  if (params.organizationId) search.set("organizationId", params.organizationId);
  if (params.unreadOnly) search.set("unreadOnly", "true");
  if (params.page != null) search.set("page", String(params.page));
  if (params.size != null) search.set("size", String(params.size));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const notificationsApi = {
  list: (params: NotificationListParams = {}) =>
    apiRequest<PagedNotifications>(base, `/notifications${buildQuery(params)}`),

  unreadCount: () =>
    apiRequest<UnreadNotificationCountResponse>(base, "/notifications/unread-count"),

  markRead: (notificationId: string) =>
    apiRequest<Notification>(base, `/notifications/${notificationId}/read`, {
      method: "PATCH",
    }),

  markAllRead: () =>
    apiRequest<void>(base, "/notifications/read-all", { method: "PATCH" }),
};
