import type { AnnouncementType } from "@/types/enums";

export interface Announcement {
  id: string;
  organizationId: string;
  createdByUserId: string;
  title: string;
  content: string;
  type: AnnouncementType;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  published: boolean;
}
