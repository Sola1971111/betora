import { BASE_URL, ApiRequestError, postRequest } from './oddsApi';

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

export interface WalletRequest {
  id: string;
  userId: string;
  userLabel: string;
  type: 'deposit' | 'withdrawal';
  method: string;
  amount: number;
  address?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  resolvedAt?: string;
}

export async function fetchWalletBalance(userId: string): Promise<number> {
  const data = await get<{ balance: number }>(`/api/wallet/balance?userId=${encodeURIComponent(userId)}`);
  return data.balance;
}

// Deposits no longer credit instantly — this creates a pending request an
// admin must approve before the balance actually changes.
export async function requestDeposit(
  userId: string,
  userLabel: string,
  amount: number,
  method: string
): Promise<WalletRequest> {
  const data = await postRequest<{ request: WalletRequest }>('/api/wallet/deposit-request', {
    userId,
    userLabel,
    amount,
    method,
  });
  return data.request;
}

// Withdrawals debit the balance immediately (funds held pending review) and
// create a pending request; rejection returns the held funds automatically.
export async function requestWithdrawal(
  userId: string,
  userLabel: string,
  amount: number,
  method: string,
  address: string
): Promise<{ request: WalletRequest; balance: number }> {
  return postRequest('/api/wallet/withdrawal-request', { userId, userLabel, amount, method, address });
}

export async function fetchWalletRequests(userId: string): Promise<WalletRequest[]> {
  const data = await get<{ requests: WalletRequest[] }>(`/api/wallet/requests?userId=${encodeURIComponent(userId)}`);
  return data.requests;
}

// ---- Admin ----

export async function fetchAdminWalletRequests(): Promise<WalletRequest[]> {
  const data = await get<{ requests: WalletRequest[] }>('/api/admin/wallet/requests');
  return data.requests;
}

export async function approveWalletRequest(id: string): Promise<WalletRequest> {
  const data = await postRequest<{ request: WalletRequest }>(`/api/admin/wallet/requests/${encodeURIComponent(id)}/approve`, {});
  return data.request;
}

export async function rejectWalletRequest(id: string): Promise<WalletRequest> {
  const data = await postRequest<{ request: WalletRequest }>(`/api/admin/wallet/requests/${encodeURIComponent(id)}/reject`, {});
  return data.request;
}
