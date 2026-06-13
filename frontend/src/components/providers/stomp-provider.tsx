"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  connectStomp,
  disconnectStomp,
  subscribeOrgAnnouncements,
  subscribeUserNotifications,
  unsubscribeOrgAnnouncements,
} from "@/lib/websocket/stomp-client";
import { invalidateFromNotification } from "@/lib/websocket/invalidation-router";
import { useAuthStore } from "@/stores/auth-store";
import { useOrgStore } from "@/stores/org-store";
import { useWebSocketStore } from "@/stores/websocket-store";
import { useNotificationStore } from "@/stores/notification-store";
import type { NotificationType } from "@/types/enums";
import { toast } from "sonner";

interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  organizationId?: string | null;
  payloadJson?: Record<string, unknown>;
}

export function StompProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const activeOrgId = useOrgStore((s) => s.activeOrg?.id ?? null);
  const setStatus = useWebSocketStore((s) => s.setStatus);
  const setSubscribedOrgId = useWebSocketStore((s) => s.setSubscribedOrgId);
  const incrementUnread = useNotificationStore((s) => s.incrementUnread);

  useEffect(() => {
    if (!accessToken || !sessionReady) {
      disconnectStomp();
      setStatus("idle");
      return;
    }

    setStatus("connecting");

    connectStomp(
      accessToken,
      () => {
        setStatus("connected");

        subscribeUserNotifications((message) => {
          try {
            const payload = JSON.parse(message.body) as NotificationPayload;
            incrementUnread();
            invalidateFromNotification(
              queryClient,
              payload.type,
              payload.organizationId,
            );
            toast(payload.title, { description: payload.body });
          } catch (error) {
            console.error("Failed to handle notification", error);
          }
        });

        if (activeOrgId) {
          subscribeOrgAnnouncements(activeOrgId, (message) => {
            try {
              const payload = JSON.parse(message.body) as {
                organizationId: string;
                announcementId: string;
                title: string;
              };
              invalidateFromNotification(
                queryClient,
                "ANNOUNCEMENT_PUBLISHED",
                payload.organizationId,
              );
              toast("New announcement", { description: payload.title });
            } catch (error) {
              console.error("Failed to handle announcement", error);
            }
          });
          setSubscribedOrgId(activeOrgId);
        }
      },
      () => {
        setStatus("disconnected");
      },
    );

    return () => {
      unsubscribeOrgAnnouncements();
      disconnectStomp();
      setStatus("idle");
      setSubscribedOrgId(null);
    };
  }, [accessToken, sessionReady, activeOrgId, queryClient, incrementUnread, setStatus, setSubscribedOrgId]);

  return <>{children}</>;
}
