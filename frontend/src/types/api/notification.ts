import type { NotificationStatus, NotificationType } from "@/types/enums";

export interface Notification {
  id: string;
  userId: string;
  organizationId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  payloadJson: Record<string, unknown>;
  status: NotificationStatus;
  createdAt: string;
  readAt: string | null;
}

export interface PagedNotifications {
  content: Notification[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
