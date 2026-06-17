"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardMetricCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  footer?: React.ReactNode;
  href?: string;
}

export function DashboardMetricCard({
  label,
  value,
  sub,
  icon: Icon,
  className,
  footer,
  href,
}: DashboardMetricCardProps) {
  const card = (
    <Card className={cn(className, href && "transition-colors hover:bg-muted/40")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon && <Icon className="size-4 text-teal-600" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        {footer}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <a href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {card}
      </a>
    );
  }

  return card;
}
