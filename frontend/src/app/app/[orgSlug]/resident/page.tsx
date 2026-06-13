"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AccommodationSummaryCard } from "@/components/resident/accommodation-summary-card";
import { AnnouncementFeed } from "@/components/resident/announcement-feed";
import { ComplaintCreateDialog } from "@/components/resident/complaint-create-dialog";
import { ComplaintList, ComplaintListFooter } from "@/components/resident/complaint-list";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnnouncements } from "@/hooks/use-announcements";
import { useMyComplaints } from "@/hooks/use-complaints";
import { usePermissions } from "@/hooks/use-permissions";
import { useOrgStore } from "@/stores/org-store";

export default function ResidentHomePage() {
  const { activeOrg, can } = usePermissions();
  const orgId = activeOrg?.id;
  const orgSlug = useOrgStore((s) => s.activeOrg?.slug);

  const { data: complaints, isLoading: complaintsLoading } = useMyComplaints(orgId);
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements(orgId);

  const openComplaints =
    complaints?.filter((c) => !["RESOLVED", "CLOSED"].includes(c.status)).length ?? 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Resident home</h1>
            <p className="mt-1 text-muted-foreground">
              {activeOrg?.name ?? "Your stay"} — updates arrive in real time.
            </p>
          </div>
          {can("complaint:create") && orgId && (
            <ComplaintCreateDialog orgId={orgId} />
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {can("allocation:read_own") && <AccommodationSummaryCard />}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Complaints</CardTitle>
              {openComplaints > 0 && (
                <span className="text-xs text-muted-foreground">
                  {openComplaints} open
                </span>
              )}
            </CardHeader>
            <CardContent>
              {can("complaint:read_own") ? (
                <>
                  <ComplaintList
                    complaints={complaints}
                    isLoading={complaintsLoading}
                    orgSlug={orgSlug}
                    compact
                  />
                  {orgSlug && complaints && complaints.length > 0 && (
                    <ComplaintListFooter orgSlug={orgSlug} />
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Complaint tracking is not available for your role.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Announcements</CardTitle>
            {orgSlug && (
              <Link
                href={`/app/${orgSlug}/resident/announcements`}
                className="inline-flex items-center text-xs font-medium text-primary hover:underline"
              >
                See all
                <ChevronRight className="size-3.5" />
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {can("announcement:read_own") ? (
              <AnnouncementFeed
                announcements={announcements}
                isLoading={announcementsLoading}
                compact
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Announcements are not available for your role.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
