import { OrgSlugBootstrap } from "@/components/app/org-slug-bootstrap";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <>
      <OrgSlugBootstrap orgSlug={orgSlug} />
      {children}
    </>
  );
}
