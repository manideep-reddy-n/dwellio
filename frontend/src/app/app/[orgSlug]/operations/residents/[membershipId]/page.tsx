"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { PageBackHeader } from "@/components/shared/page-back-header";
import { PageTitle } from "@/components/shared/page-title";
import { ResidentLifecycleProfileView } from "@/components/operations/resident-lifecycle-profile";
import { OperationsShell } from "@/components/operations/operations-shell";
import { OpsGuard } from "@/components/operations/ops-guard";
import { useResidentLifecycleProfile } from "@/hooks/use-resident-lifecycle";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions/codes";
import { use } from "react";

interface ResidentProfilePageProps {
  params: Promise<{ orgSlug: string; membershipId: string }>;
}

export default function ResidentProfilePage({ params }: ResidentProfilePageProps) {
  const { orgSlug, membershipId } = use(params);
  const { activeOrg } = usePermissions();
  const orgId = activeOrg?.id;
  const { data, isLoading, isError, refetch } = useResidentLifecycleProfile(orgId, membershipId);

  return (
    <PageTransition>
      <PageTitle title={data?.membership.userFullName ?? "Resident profile"} />
      <div className="mb-4">
        <PageBackHeader
          href={`/app/${orgSlug}/operations/residents`}
          label="Residents"
        />
      </div>
      <OpsGuard permission={PERMISSIONS.RESIDENT_MANAGE}>
        <OperationsShell
          orgSlug={orgSlug}
          title={data?.membership.userFullName ?? "Resident profile"}
          description="Membership, accommodation, billing, complaints, reviews, and activity in one place."
        >
          {orgId && (
            <ResidentLifecycleProfileView
              orgId={orgId}
              orgSlug={orgSlug}
              profile={data}
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
