import Link from "next/link";
import { PageTransition } from "@/components/shared/page-transition";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AppHubPage() {
  // Server component hub — client org resolution in Phase 2
  return (
    <PageTransition>
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Dwellio</CardTitle>
            <CardDescription>
              Select an organization or create one to access resident and operations dashboards.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/app/organizations" className={cn(buttonVariants())}>
              My organizations
            </Link>
            <Link
              href="/app/organizations/new"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Create organization
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
