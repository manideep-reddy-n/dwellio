"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  description,
  href,
  linkLabel = "View all",
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2 border-b pb-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
          >
            {linkLabel}
            <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
