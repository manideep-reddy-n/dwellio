import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";

export type NotificationPreferenceCategory =
  | "COMPLAINTS"
  | "PAYMENTS"
  | "ANNOUNCEMENTS"
  | "REVIEWS"
  | "MEMBERSHIP"
  | "SYSTEM";

export interface NotificationPreference {
  category: NotificationPreferenceCategory;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  updatedAt: string;
}

export interface PushConfig {
  vapidPublicKey: string | null;
  pushConfigured: boolean;
}

export interface PushSubscription {
  id: string;
  endpoint: string;
}

export const pushApi = {
  config: () => apiRequest<PushConfig>(apiConfig.baseUrl, "/push/config"),

  listSubscriptions: () => apiRequest<PushSubscription[]>(apiConfig.baseUrl, "/push/subscriptions"),

  register: (body: { endpoint: string; p256dh: string; auth: string; userAgent?: string }) =>
    apiRequest<PushSubscription>(apiConfig.baseUrl, "/push/subscriptions", {
      method: "POST",
      body,
    }),

  unregister: (endpoint: string) =>
    apiRequest<void>(
      apiConfig.baseUrl,
      `/push/subscriptions?endpoint=${encodeURIComponent(endpoint)}`,
      { method: "DELETE" },
    ),
};

export const notificationPreferencesApi = {
  list: () => apiRequest<NotificationPreference[]>(apiConfig.baseUrl, "/notification-preferences"),

  update: (
    category: NotificationPreferenceCategory,
    body: Partial<Pick<NotificationPreference, "inAppEnabled" | "pushEnabled" | "emailEnabled">>,
  ) =>
    apiRequest<NotificationPreference>(apiConfig.baseUrl, `/notification-preferences/${category}`, {
      method: "PATCH",
      body,
    }),
};
