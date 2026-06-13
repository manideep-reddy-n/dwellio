/** STOMP destination helpers — keep subscription paths centralized. */

export const stompDestinations = {
  userNotifications: "/user/queue/notifications",
  orgAnnouncements: (orgId: string) => `/topic/org/${orgId}/announcements`,
} as const;
