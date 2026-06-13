"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { joinRequestApi } from "@/lib/api/join-requests";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

interface JoinRequestFormProps {
  organizationId: string;
  organizationName: string;
  slug: string;
}

export function JoinRequestForm({
  organizationId,
  organizationName,
  slug,
}: JoinRequestFormProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!isAuthenticated()) {
      router.push(`/login?next=${encodeURIComponent(`/${slug}/join`)}`);
      return;
    }

    setLoading(true);
    try {
      await joinRequestApi.submit(organizationId, {
        message: message.trim() || undefined,
      });
      setSubmitted(true);
      toast.success("Join request submitted", {
        description: `${organizationName} will review your request.`,
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not submit join request");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border bg-muted/40 p-6 text-center">
        <p className="font-medium">Request sent!</p>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;ll be notified when {organizationName} approves your request.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="message">Message to the property (optional)</Label>
        <Textarea
          id="message"
          placeholder="Tell them why you'd like to join…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          rows={4}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting…" : isAuthenticated() ? "Submit join request" : "Sign in to join"}
      </Button>
    </form>
  );
}
