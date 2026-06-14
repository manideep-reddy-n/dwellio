"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminRootPage() {
  const router = useRouter();
  const { ready, isAuthenticated } = useAdminAuth();

  useEffect(() => {
    if (!ready) return;
    router.replace(isAuthenticated ? "/admin/overview" : "/admin/login");
  }, [ready, isAuthenticated, router]);

  return <Skeleton className="mx-auto mt-12 h-32 max-w-7xl rounded-xl" />;
}
