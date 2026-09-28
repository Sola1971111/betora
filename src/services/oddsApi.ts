import type { ApiCompetition, ApiErrorResponse, ApiEvent, ApiEventResponse, ApiEventsResponse, ApiSport, ApiSportsResponse } from './apiTypes';
import type { Competition, Match, Sport } from '../types';

export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787';
const REQUEST_TIMEOUT_MS = 10000;

export class ApiRequestError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function request<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, { signal: controller.signal });
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const body = (await res.json()) as ApiErrorResponse;
        if (body.error) message = body.error;
      } catch {
        // response wasn't JSON — keep the generic message
      }
      throw new ApiRequestError(message, res.status);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiRequestError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiRequestError('Request timed out');
    }
    throw new ApiRequestError('Unable to reach the server');
  } finally {
    clearTimeout(timeout);
  }
}

export async function postRequest<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const errBody = (await res.json()) as ApiErrorResponse;
        if (errBody.error) message = errBody.error;
      } catch {
        // response wasn't JSON
      }
      throw new ApiRequestError(message, res.status);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiRequestError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiRequestError('Request timed out');
    }
    throw new ApiRequestError('Unable to reach the server');
  } finally {
    clearTimeout(timeout);
  }
}

// ---- Adapters: ApiEvent/ApiSport/ApiCompetition -> Betora's internal Match/Sport/Competition ----

function adaptEvent(event: ApiEvent): Match {
  return {
    id: event.id,
    sportId: event.sport,
    competitionId: event.leagueKey,
    competitionName: event.league,
    homeTeam: event.homeTeam,
    awayTeam: event.awayTeam,
    homeTeamLogo: event.homeTeamLogo,
    awayTeamLogo: event.awayTeamLogo,
    date: event.startTime,
    status: event.status === 'LIVE' ? 'live' : event.status === 'FINISHED' ? 'finished' : 'upcoming',
    liveScore: event.liveScore
      ? { home: event.liveScore.home, away: event.liveScore.away, minute: event.liveScore.minute ?? null }
      : undefined,
    markets: event.markets.map((m) => ({
      id: m.id,
      key: m.key,
      name: m.title,
      category: m.category,
      selections: m.outcomes.map((o) => ({
        id: o.id,
        label: o.name,
        odds: o.price,
        point: o.point,
      })),
    })),
    totalMarketsCount: event.totalMarketsCount,
    lastUpdate: event.markets[0]?.lastUpdate ?? null,
    bookmakerTitle: event.bookmakerTitle,
  };
}

function adaptSport(s: ApiSport): Sport {
  return { id: s.key, name: s.name };
}

function adaptCompetition(c: ApiCompetition): Competition {
  return { id: c.id, name: c.name, sportId: c.sport, country: c.country };
}

// ---- Public API ----

export interface SportsAndCompetitions {
  sports: Sport[];
  competitions: Competition[];
  liveOddsRefreshIntervalMs: number;
}

export async function fetchSports(): Promise<SportsAndCompetitions> {
  const data = await request<ApiSportsResponse>('/api/sports');
  return {
    sports: data.sports.map(adaptSport),
    competitions: data.competitions.map(adaptCompetition),
    liveOddsRefreshIntervalMs: data.config.liveOddsRefreshIntervalMs,
  };
}

export async function fetchEvents(sport: string): Promise<Match[]> {
  const data = await request<ApiEventsResponse>(`/api/events?sport=${encodeURIComponent(sport)}`);
  return data.events.map(adaptEvent);
}

export async function fetchLiveEvents(sport?: string, limit?: number): Promise<Match[]> {
  const params = new URLSearchParams();
  if (sport) params.set('sport', sport);
  if (limit) params.set('limit', String(limit));
  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await request<ApiEventsResponse>(`/api/events/live${query}`);
  return data.events.map(adaptEvent);
}

export async function fetchEventById(sport: string, id: string): Promise<Match> {
  const data = await request<ApiEventResponse>(`/api/events/${encodeURIComponent(id)}?sport=${encodeURIComponent(sport)}`);
  return adaptEvent(data.event);
}
