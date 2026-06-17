import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const quote = {
  text: "This listing checked out early — the address may be wrong or the stay is no longer public.",
  author: "Dwellio",
};

export default function OrgNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-6xl font-bold tracking-tighter text-teal-600/20 dark:text-teal-400/20">
        404
      </p>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Listing not found</h1>
        <p className="text-muted-foreground">
          This organization may not be verified yet or the link is incorrect.
        </p>
      </div>
      <blockquote className="rounded-xl border border-dashed px-5 py-4 text-sm italic text-muted-foreground">
        &ldquo;{quote.text}&rdquo;
        <footer className="mt-2 text-xs not-italic text-muted-foreground/80">— {quote.author}</footer>
      </blockquote>
      <Link href="/explore" className={buttonVariants({ className: "mt-2" })}>
        Explore stays
      </Link>
    </div>
  );
}
