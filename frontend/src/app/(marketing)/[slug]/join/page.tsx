import { notFound } from "next/navigation";
import { JoinPageContent } from "@/components/marketplace/join-page-content";
import { PageTransition } from "@/components/shared/page-transition";
import { fetchMarketplaceOrg } from "@/lib/api/marketplace-server";

interface JoinPageProps {
  params: Promise<{ slug: string }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { slug } = await params;

  let org: Awaited<ReturnType<typeof fetchMarketplaceOrg>>;
  try {
    org = await fetchMarketplaceOrg(slug);
  } catch {
    notFound();
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <JoinPageContent
          organizationId={org.id}
          organizationSlug={slug}
          organizationName={org.name}
        />
      </div>
    </PageTransition>
  );
}
