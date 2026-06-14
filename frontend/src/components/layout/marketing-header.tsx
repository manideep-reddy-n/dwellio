import Link from "next/link";
import { MarketingHeaderActions } from "@/components/layout/marketing-header-actions";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Home
          </Link>
          <Link href="/explore" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Explore
          </Link>
          <MarketingHeaderActions />
        </nav>
      </div>
    </header>
  );
}
