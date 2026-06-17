import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const quotes = [
  {
    text: "Not all who wander are lost — but this page definitely is.",
    author: "Adapted from Tolkien",
  },
  {
    text: "Home is where the URL works. This one doesn't.",
    author: "Dwellio",
  },
];

function pickQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export default function NotFound() {
  const quote = pickQuote();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-7xl font-bold tracking-tighter text-teal-600/20 dark:text-teal-400/20">
        404
      </p>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The address may be wrong, or the page may have moved.
        </p>
      </div>
      <blockquote className="max-w-md rounded-xl border border-dashed border-teal-200/80 bg-teal-50/50 px-5 py-4 text-sm italic text-muted-foreground dark:border-teal-900/50 dark:bg-teal-950/20">
        &ldquo;{quote.text}&rdquo;
        <footer className="mt-2 text-xs not-italic text-muted-foreground/80">— {quote.author}</footer>
      </blockquote>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/" className={cn(buttonVariants({ size: "sm" }))}>
          Go home
        </Link>
        <Link href="/explore" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Explore stays
        </Link>
      </div>
    </div>
  );
}
