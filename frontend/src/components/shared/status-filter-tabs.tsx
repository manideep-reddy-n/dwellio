"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface StatusFilterOption<T extends string> {
  value: T | "ALL";
  label: string;
  count?: number;
}

interface StatusFilterTabsProps<T extends string> {
  value: T | "ALL";
  onChange: (value: T | "ALL") => void;
  options: StatusFilterOption<T>[];
  className?: string;
}

export function StatusFilterTabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: StatusFilterTabsProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            buttonVariants({
              variant: value === option.value ? "default" : "outline",
              size: "sm",
            }),
            "rounded-full",
          )}
        >
          {option.label}
          {option.count != null && option.count > 0 ? (
            <span className="ml-1.5 tabular-nums opacity-80">({option.count})</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function countByField<T extends string, K extends string>(
  items: Array<Record<K, T>>,
  field: K,
  status: T | "ALL",
): number {
  if (status === "ALL") return items.length;
  return items.filter((item) => item[field] === status).length;
}
