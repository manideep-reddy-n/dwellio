import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const quotes = [
  {
    text: "You can't manage a property from a page that doesn't exist.",
    author: "Dwellio",
  },
  {
    text: "Every great dashboard has a back button — this page forgot to bring one.",
    author: "Dwellio",
  },
];

function pickQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export default function AppNotFound() {
  const quote = pickQuote();

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-6xl font-bold tracking-tighter text-teal-600/20 dark:text-teal-400/20">
        404
      </p>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          This app page does not exist. If you just added a new route, try restarting the dev server.
        </p>
      </div>
      <blockquote className="max-w-md rounded-xl border border-dashed border-teal-200/80 bg-teal-50/50 px-5 py-4 text-sm italic text-muted-foreground dark:border-teal-900/50 dark:bg-teal-950/20">
        &ldquo;{quote.text}&rdquo;
        <footer className="mt-2 text-xs not-italic text-muted-foreground/80">— {quote.author}</footer>
      </blockquote>
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
