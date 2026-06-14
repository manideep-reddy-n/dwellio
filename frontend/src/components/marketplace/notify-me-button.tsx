"use client";

import { useRouter } from "next/navigation";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { availabilityAlertsApi } from "@/lib/api/availability-alerts";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { toast } from "sonner";

interface NotifyMeButtonProps {
  slug: string;
  full?: boolean;
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function NotifyMeButton({ slug, full = true, size = "default", className }: NotifyMeButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { authReady } = useAuthReady();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.availabilityAlerts.status(slug),
    queryFn: () => availabilityAlertsApi.status(slug),
    enabled: authReady && full,
  });

  const subscribe = useMutation({
    mutationFn: () => availabilityAlertsApi.subscribe(slug),
    onSuccess: () => {
      toast.success("We will notify you when space opens up");
      void queryClient.invalidateQueries({ queryKey: queryKeys.availabilityAlerts.status(slug) });
    },
    onError: (error: Error) => toast.error(error.message || "Could not subscribe"),
  });

  const unsubscribe = useMutation({
    mutationFn: () => availabilityAlertsApi.unsubscribe(slug),
    onSuccess: () => {
      toast.success("Availability alerts turned off");
      void queryClient.invalidateQueries({ queryKey: queryKeys.availabilityAlerts.status(slug) });
    },
    onError: () => toast.error("Could not unsubscribe"),
  });

  if (!full) {
    return null;
  }

  function handleClick() {
    if (!authReady) {
      router.push(`/login?next=/${slug}`);
      return;
    }
    if (data?.subscribed) {
      unsubscribe.mutate();
    } else {
      subscribe.mutate();
    }
  }

  const pending = subscribe.isPending || unsubscribe.isPending;
  const subscribed = data?.subscribed;

  return (
    <Button
      type="button"
      variant={subscribed ? "secondary" : "outline"}
      size={size}
      className={className}
      disabled={isLoading || pending}
      onClick={handleClick}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : subscribed ? (
        <BellOff className="size-4" />
      ) : (
        <Bell className="size-4" />
      )}
      {subscribed ? "Alert on" : "Notify me"}
    </Button>
  );
}
