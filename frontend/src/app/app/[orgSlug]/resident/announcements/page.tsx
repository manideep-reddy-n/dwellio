"use client";

import { AnnouncementFeed } from "@/components/resident/announcement-feed";
import { PageTransition } from "@/components/shared/page-transition";
import { useAnnouncements } from "@/hooks/use-announcements";
import { usePermissions } from "@/hooks/use-permissions";

export default function ResidentAnnouncementsPage() {
  const { activeOrg, can } = usePermissions();
  const orgId = activeOrg?.id;

  const { data: announcements, isLoading } = useAnnouncements(orgId);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="mt-1 text-muted-foreground">
            Notices from your property — new posts appear automatically.
          </p>
        </div>

        {can("announcement:read_own") ? (
          <AnnouncementFeed announcements={announcements} isLoading={isLoading} />
        ) : (
          <p className="text-sm text-muted-foreground">
            You do not have permission to view announcements.
          </p>
        )}
      </div>
    </PageTransition>
  );
}
