import { create } from "zustand";
import type { NotificationType } from "@/types/enums";

export interface ToastNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  organizationId?: string | null;
  href?: string;
}

interface NotificationState {
  unreadCount: number;
  toasts: ToastNotification[];
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  pushToast: (toast: ToastNotification) => void;
  dismissToast: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  toasts: [],

  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),

  pushToast: (toast) =>
    set((s) => ({
      toasts: [toast, ...s.toasts].slice(0, 5),
    })),

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
