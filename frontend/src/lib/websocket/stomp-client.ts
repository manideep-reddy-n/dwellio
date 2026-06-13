import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { apiConfig } from "@/config/api";

export type MessageHandler = (message: IMessage) => void;

let client: Client | null = null;
let userSubscription: StompSubscription | null = null;
let orgSubscription: StompSubscription | null = null;

function buildWsUrl(accessToken: string): string {
  const url = new URL(apiConfig.wsUrl);
  url.searchParams.set("token", accessToken);
  return url.toString();
}

export function getStompClient(): Client | null {
  return client;
}

export function connectStomp(
  accessToken: string,
  onConnect?: () => void,
  onDisconnect?: () => void,
): Client {
  if (client?.active) {
    return client;
  }

  client = new Client({
    brokerURL: buildWsUrl(accessToken),
    connectHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => onConnect?.(),
    onDisconnect: () => onDisconnect?.(),
    onStompError: (frame) => {
      console.error("STOMP error", frame.headers["message"], frame.body);
    },
  });

  client.activate();
  return client;
}

export function subscribeUserNotifications(handler: MessageHandler) {
  if (!client?.connected) return;

  userSubscription?.unsubscribe();
  userSubscription = client.subscribe("/user/queue/notifications", handler);
}

export function subscribeOrgAnnouncements(orgId: string, handler: MessageHandler) {
  if (!client?.connected) return;

  orgSubscription?.unsubscribe();
  orgSubscription = client.subscribe(`/topic/org/${orgId}/announcements`, handler);
}

export function unsubscribeOrgAnnouncements() {
  orgSubscription?.unsubscribe();
  orgSubscription = null;
}

export function disconnectStomp() {
  userSubscription?.unsubscribe();
  orgSubscription?.unsubscribe();
  userSubscription = null;
  orgSubscription = null;

  if (client?.active) {
    void client.deactivate();
  }
  client = null;
}
