"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageBackHeaderProps {
  href: string;
  label?: string;
  title?: string;
  description?: string;
  className?: string;
}

export function PageBackHeader({
  href,
  label = "Back",
  title,
  description,
  className,
}: PageBackHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <Link
        href={href}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {label}
      </Link>
      {(title || description) && (
        <div>
          {title && <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}

interface ResidentSubpageHeaderProps {
  orgSlug: string;
  title: string;
  description?: string;
}

export function ResidentSubpageHeader({ orgSlug, title, description }: ResidentSubpageHeaderProps) {
  return (
    <PageBackHeader
      href={`/app/${orgSlug}/resident`}
      label="My stay"
      title={title}
      description={description}
    />
  );
}

/** Shows back-to-home on resident subpages (not on /resident itself). */
export function ResidentAutoBack({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();
  const home = `/app/${orgSlug}/resident`;
  if (pathname === home || !pathname.startsWith(home + "/")) return null;

  return (
    <div className="mb-4">
      <PageBackHeader href={home} label="My stay" />
    </div>
  );
}

/** Back to operations dashboard from subpages. */
export function OperationsAutoBack({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();
  const dashboard = `/app/${orgSlug}/operations`;
  if (pathname === dashboard || !pathname.startsWith(`/app/${orgSlug}/operations/`)) {
    return null;
  }

  return (
    <div className="mb-4">
      <PageBackHeader href={dashboard} label="Dashboard" />
    </div>
  );
}
