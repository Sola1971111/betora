import { BASE_URL, ApiRequestError, postRequest } from './oddsApi';
import type { VirtualBet, VirtualMatchday, VirtualUserSummary, VirtualUpcomingPreview } from '../types/virtual';

const REQUEST_TIMEOUT_MS = 10000;

async function get<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
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

export async function fetchCurrentMatchday(): Promise<VirtualMatchday> {
  const data = await get<{ matchday: VirtualMatchday }>('/api/virtual/current');
  return data.matchday;
}

export async function fetchUpcomingMatchdays(count = 2): Promise<VirtualUpcomingPreview[]> {
  const data = await get<{ matchdays: VirtualUpcomingPreview[] }>(`/api/virtual/upcoming?count=${count}`);
  return data.matchdays;
}

export interface PlaceVirtualBetParams {
  userId: string;
  userLabel: string;
  stake: number;
  picks: { fixtureId: string; marketKey: string; outcomeId: string }[];
}

export async function placeVirtualBet(params: PlaceVirtualBetParams): Promise<VirtualBet> {
  const data = await postRequest<{ bet: VirtualBet }>('/api/virtual/bets', params);
  return data.bet;
}

export async function fetchVirtualBetHistory(userId: string): Promise<VirtualBet[]> {
  const data = await get<{ bets: VirtualBet[] }>(`/api/virtual/bets?userId=${encodeURIComponent(userId)}`);
  return data.bets;
}

export async function fetchVirtualBetById(id: string): Promise<VirtualBet> {
  const data = await get<{ bet: VirtualBet }>(`/api/virtual/bets/${encodeURIComponent(id)}`);
  return data.bet;
}

// ---- Admin ----

export async function fetchAdminVirtualBets(): Promise<VirtualBet[]> {
  const data = await get<{ bets: VirtualBet[] }>('/api/admin/virtual/bets');
  return data.bets;
}

export async function fetchAdminVirtualUsers(): Promise<VirtualUserSummary[]> {
  const data = await get<{ users: VirtualUserSummary[] }>('/api/admin/virtual/users');
  return data.users;
}

export async function fetchAdminVirtualMatchdays(): Promise<VirtualMatchday[]> {
  const data = await get<{ matchdays: VirtualMatchday[] }>('/api/admin/virtual/matchdays');
  return data.matchdays;
}
