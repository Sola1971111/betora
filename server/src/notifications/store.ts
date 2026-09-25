import type { StoredNotification } from './types.js';

class NotificationStore {
  private notifications: StoredNotification[] = [];

  create(userId: string, title: string, message: string): StoredNotification {
    const notification: StoredNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      title,
      message,
      date: new Date().toISOString(),
      read: false,
    };
    this.notifications.push(notification);
    return notification;
  }

  getForUser(userId: string): StoredNotification[] {
    return this.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  markRead(id: string): StoredNotification | null {
    const notification = this.notifications.find((n) => n.id === id);
    if (!notification) return null;
    notification.read = true;
    return notification;
  }
}

export const notificationStore = new NotificationStore();
