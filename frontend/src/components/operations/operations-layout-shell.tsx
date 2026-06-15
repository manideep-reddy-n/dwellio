"use client";

import { OperationsNav } from "@/components/operations/operations-nav";
import { OperationsAutoBack } from "@/components/shared/page-back-header";
import { useOrgStore } from "@/stores/org-store";

export function OperationsLayoutShell({ children }: { children: React.ReactNode }) {
  const orgSlug = useOrgStore((s) => s.activeOrg?.slug);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {orgSlug ? <OperationsAutoBack orgSlug={orgSlug} /> : null}
      {orgSlug ? <OperationsNav orgSlug={orgSlug} /> : null}
      {children}
    </div>
  );
}
