import { BASE_URL, ApiRequestError } from './oddsApi';

export interface ApiTransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'winnings' | 'bonus';
  method?: string;
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  walletRequestId?: string;
}

export async function fetchTransactions(userId: string): Promise<ApiTransaction[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${BASE_URL}/api/transactions?userId=${encodeURIComponent(userId)}`, {
      signal: controller.signal,
    });
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
    const data = (await res.json()) as { transactions: ApiTransaction[] };
    return data.transactions;
  } catch (err) {
    if (err instanceof ApiRequestError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') throw new ApiRequestError('Request timed out');
    throw new ApiRequestError('Unable to reach the server');
  } finally {
    clearTimeout(timeout);
  }
}
