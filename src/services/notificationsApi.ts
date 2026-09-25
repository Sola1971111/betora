import { BASE_URL, ApiRequestError, postRequest } from './oddsApi';

export interface ApiNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

async function get<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${BASE_URL}${path}`, { signal: controller.signal });
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        // not JSON
      }
      throw new ApiRequestError(message, res.status);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiRequestError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') throw new ApiRequestError('Request timed out');
    throw new ApiRequestError('Unable to reach the server');
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchNotifications(userId: string): Promise<ApiNotification[]> {
  const data = await get<{ notifications: ApiNotification[] }>(`/api/notifications?userId=${encodeURIComponent(userId)}`);
  return data.notifications;
}

export async function markNotificationRead(id: string): Promise<void> {
  await postRequest(`/api/notifications/${encodeURIComponent(id)}/read`, {});
}
