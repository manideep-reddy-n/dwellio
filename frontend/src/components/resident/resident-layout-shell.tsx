"use client";

import { ResidentShell } from "@/components/resident/resident-shell";
import { ResidentDesktopNav } from "@/components/resident/resident-desktop-nav";
import { ResidentAutoBack } from "@/components/shared/page-back-header";
import { useOrgStore } from "@/stores/org-store";

export function ResidentLayoutShell({ children }: { children: React.ReactNode }) {
  const orgSlug = useOrgStore((s) => s.activeOrg?.slug);

  return (
    <ResidentShell>
      <div className="mx-auto w-full max-w-5xl">
        {orgSlug ? <ResidentDesktopNav orgSlug={orgSlug} /> : null}
        {orgSlug ? <ResidentAutoBack orgSlug={orgSlug} /> : null}
        {children}
      </div>
    </ResidentShell>
  );
}
