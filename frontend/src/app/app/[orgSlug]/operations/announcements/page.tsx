"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { AnnouncementManager } from "@/components/operations/announcement-manager";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { useAnnouncements } from "@/hooks/use-ops-announcements";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";

export default function AnnouncementsPage() {
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = activeOrg?.slug ?? "";
  const { data, isLoading, isError, refetch } = useAnnouncements(orgId);

  return (
    <PageTransition>
      <OpsGuard permission={PERMISSIONS.ANNOUNCEMENT_MANAGE}>
        <OperationsShell
          orgSlug={orgSlug}
          title="Announcements"
          description="Draft, publish, and broadcast updates to residents."
        >
          {orgId && (
            <AnnouncementManager
              orgId={orgId}
              announcements={data}
              isLoading={isLoading}
              isError={isError}
              onRetry={() => void refetch()}
            />
          )}
        </OperationsShell>
      </OpsGuard>
    </PageTransition>
  );
}
