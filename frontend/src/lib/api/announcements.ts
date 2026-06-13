import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { Announcement } from "@/types/api/announcement";
import type { AnnouncementType } from "@/types/enums";

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  type: AnnouncementType;
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
  type?: AnnouncementType;
}

export const announcementsApi = {
  list: (orgId: string) =>
    apiRequest<Announcement[]>(apiConfig.baseUrl, `/organizations/${orgId}/announcements`),

  get: (orgId: string, announcementId: string) =>
    apiRequest<Announcement>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/announcements/${announcementId}`,
    ),

  create: (orgId: string, body: CreateAnnouncementInput) =>
    apiRequest<Announcement>(apiConfig.baseUrl, `/organizations/${orgId}/announcements`, {
      method: "POST",
      body,
    }),

  update: (orgId: string, announcementId: string, body: UpdateAnnouncementInput) =>
    apiRequest<Announcement>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/announcements/${announcementId}`,
      { method: "PATCH", body },
    ),

  publish: (orgId: string, announcementId: string) =>
    apiRequest<Announcement>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/announcements/${announcementId}/publish`,
      { method: "POST" },
    ),

  delete: (orgId: string, announcementId: string) =>
    apiRequest<void>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/announcements/${announcementId}`,
      { method: "DELETE" },
    ),
};
