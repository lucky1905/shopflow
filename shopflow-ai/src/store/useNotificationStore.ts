import { create } from 'zustand';
import type { Notification, NotificationState } from '@/types';

interface NotificationStore extends NotificationState {
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  totalUnread: 0,
  isOpen: false,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      totalUnread: state.totalUnread + 1,
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        totalUnread: notification && !notification.read
          ? state.totalUnread - 1
          : state.totalUnread,
      };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (notification && !notification.read) {
        return {
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          totalUnread: state.totalUnread - 1,
        };
      }
      return state;
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      totalUnread: 0,
    }));
  },

  clearAll: () => {
    set({
      notifications: [],
      totalUnread: 0,
    });
  },

  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
}));
