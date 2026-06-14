import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AppNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        This app page does not exist or the dev server needs a restart after new routes were added.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/app" className={cn(buttonVariants({ size: "sm" }))}>
          Go to app home
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Marketing home
        </Link>
      </div>
    </div>
  );
}
