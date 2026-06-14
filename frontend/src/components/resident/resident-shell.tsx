"use client";

import { useOrgStore } from "@/stores/org-store";
import { ResidentBottomNav } from "@/components/resident/resident-bottom-nav";

export function ResidentShell({ children }: { children: React.ReactNode }) {
  const orgSlug = useOrgStore((s) => s.activeOrg?.slug);

  return (
    <>
      <div className="pb-20 md:pb-0">{children}</div>
      {orgSlug ? <ResidentBottomNav orgSlug={orgSlug} /> : null}
    </>
  );
}
