"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMyMemberships } from "@/hooks/use-memberships";
import {
  appHomeLabel,
  resolveAppHome,
} from "@/lib/navigation/app-routing";
import { cn } from "@/lib/utils";

export function MarketingHeaderActions() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, sessionReady } = useAuth();
  const { data: memberships = [] } = useMyMemberships();

  useEffect(() => setMounted(true), []);

  if (!mounted || !sessionReady) {
    return (
      <>
        <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Sign in
        </Link>
        <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
          Get started
        </Link>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Sign in
        </Link>
        <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
          Get started
        </Link>
      </>
    );
  }

  return (
    <Link
      href={resolveAppHome(memberships)}
      className={cn(
        buttonVariants({
          variant: pathname.startsWith("/app") ? "secondary" : "ghost",
          size: "sm",
        }),
      )}
    >
      {appHomeLabel(memberships)}
    </Link>
  );
}
