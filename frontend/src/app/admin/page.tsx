"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminRootPage() {
  const router = useRouter();
  const { user, sessionReady } = useAuth();

  useEffect(() => {
    if (!sessionReady) return;
    if (!user?.platformAdmin) {
      router.replace("/app");
      return;
    }
    router.replace("/admin/overview");
  }, [user, sessionReady, router]);

  return <Skeleton className="mx-auto mt-12 h-32 max-w-7xl rounded-xl" />;
}
