import { pool } from '../db/pool.js';
import type { StoredNotification } from './types.js';

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
}

function toStored(row: NotificationRow): StoredNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    date: row.date.toISOString(),
    read: row.read,
  };
}

class NotificationStore {
  async create(userId: string, title: string, message: string): Promise<StoredNotification> {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await pool.query<NotificationRow>(
      `INSERT INTO notifications (id, user_id, title, message) VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, userId, title, message]
    );
    return toStored(result.rows[0]);
  }

  async getForUser(userId: string): Promise<StoredNotification[]> {
    const result = await pool.query<NotificationRow>(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    return result.rows.map(toStored);
  }

  async markRead(id: string): Promise<StoredNotification | null> {
    const result = await pool.query<NotificationRow>(
      'UPDATE notifications SET read = true WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] ? toStored(result.rows[0]) : null;
  }
}

export const notificationStore = new NotificationStore();