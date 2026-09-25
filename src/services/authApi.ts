import { postRequest, ApiRequestError, BASE_URL } from './oddsApi';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  balance: number;
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

export async function signup(fullName: string, email: string, password: string): Promise<AuthUser> {
  const data = await postRequest<{ user: AuthUser }>('/api/auth/signup', { fullName, email, password });
  return data.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await postRequest<{ user: AuthUser }>('/api/auth/login', { email, password });
  return data.user;
}

export async function fetchAdminUsers(): Promise<AuthUser[]> {
  const data = await get<{ users: AuthUser[] }>('/api/admin/users');
  return data.users;
}

export async function adjustUserBalance(userId: string, amount: number, reason?: string): Promise<AuthUser> {
  const data = await postRequest<{ user: AuthUser }>('/api/admin/wallet/adjust', { userId, amount, reason });
  return data.user;
}
