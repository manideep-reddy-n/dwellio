import Link from "next/link";
import Image from "next/image";
import { MarketingHeaderActions } from "@/components/layout/marketing-header-actions";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Image
            src="/dwellio-logo.webp"
            alt="Dwellio Logo"
            width={28}
            height={28}
            className="size-7 object-contain rounded-lg"
          />
          <span>{siteConfig.name}</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
            Home
          </Link>
          <Link href="/explore" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-2 sm:px-3")}>
            Explore
          </Link>
          <MarketingHeaderActions />
        </nav>
      </div>
    </header>
  );
}
