import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  showIcon?: boolean;
}

export function VerifiedBadge({ className, showIcon = true }: VerifiedBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300",
        className,
      )}
    >
      {showIcon && <BadgeCheck className="mr-1 size-3.5" />}
      Verified Organization
    </Badge>
  );
}
