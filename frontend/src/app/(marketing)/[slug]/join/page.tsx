import Link from "next/link";
import { notFound } from "next/navigation";
import { JoinRequestForm } from "@/components/marketplace/join-request-form";
import { PageTransition } from "@/components/shared/page-transition";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMarketplaceOrg } from "@/lib/api/marketplace-server";
import { cn } from "@/lib/utils";

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
        <Link
          href={`/${slug}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4 inline-flex")}
        >
          ← Back to profile
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Request to join {org.name}</CardTitle>
            <CardDescription>
              Submit a join request. The property team will review and notify you when approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JoinRequestForm
              organizationId={org.id}
              organizationName={org.name}
              slug={slug}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
