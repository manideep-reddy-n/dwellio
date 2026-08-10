import { Building2 } from "lucide-react";
import Image from "next/image";
import { resolveMediaUrl } from "@/lib/media/resolve-url";
import { cn } from "@/lib/utils";

const sizeClasses = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
} as const;

interface OrganizationLogoProps {
  name: string;
  logoUrl?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function OrganizationLogo({
  name,
  logoUrl,
  size = "sm",
  className,
}: OrganizationLogoProps) {
  const src = resolveMediaUrl(logoUrl);

  if (src) {
    return (
      <div className={cn("relative shrink-0", sizeClasses[size], className)}>
        <Image
          src={src}
          alt=""
          fill
          sizes="56px"
          className="rounded-md border bg-background object-contain p-0.5"
        />
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border bg-muted font-semibold text-muted-foreground",
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase() || <Building2 className="size-3.5" />}
    </span>
  );
}
