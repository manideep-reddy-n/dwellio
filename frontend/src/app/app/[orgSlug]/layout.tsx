"use client";

import { OrgSlugBootstrap } from "@/components/app/org-slug-bootstrap";

export default function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  return (
    <>
      <OrgSlugBootstrap params={params} />
      {children}
    </>
  );
}
