import type { RawEvent, RawSport } from './rawTypes.js';
import { MOCK_EVENTS, MOCK_LIVE_EVENTS, MOCK_SPORTS } from './mockData.js';
import { TtlCache } from './cache.js';
import { BETORA_SPORTS, SPORT_KEY_PREFIXES, type BetoraSport } from './sportMapping.js';

export interface OddsApiConfig {
  apiKey: string;
  baseUrl: string;
  region: string;
  oddsFormat: string;
  useMockData: boolean;
}

const FETCH_TIMEOUT_MS = 8000;
const SPORTS_LIST_TTL_MS = 10 * 60_000;
const UPCOMING_EVENTS_TTL_MS = 60_000;
const LIVE_EVENTS_TTL_MS = 10_000;
const SINGLE_EVENT_TTL_MS = 20_000;
const BROKEN_KEY_COOLDOWN_MS = 5 * 60_000; // stop hammering a known-broken key for 5 minutes

const cache = new TtlCache();

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('[ODDS API]', ...args);
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export class OddsApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'OddsApiError';
  }
}

export class OddsApiService {
  private brokenUntil = 0;

  constructor(private config: OddsApiConfig) {}

  private get mockMode(): boolean {
    return this.config.useMockData || !this.config.apiKey || Date.now() < this.brokenUntil;
  }

  private markBroken(reason: string) {
    if (this.brokenUntil < Date.now()) {
      log(`WARNING: real API call failed (${reason}) — serving demo data for the next 5 minutes. Check ODDS_API_KEY.`);
    }
    this.brokenUntil = Date.now() + BROKEN_KEY_COOLDOWN_MS;
  }

  async getSports(): Promise<RawSport[]> {
    const cacheKey = 'sports-list';
    const cached = cache.get<RawSport[]>(cacheKey);
    if (cached) return cached;

    return cache.dedupe(cacheKey, async () => {
      if (this.mockMode) {
        log('mock/demo mode — serving bundled sports list');
        cache.set(cacheKey, MOCK_SPORTS, SPORTS_LIST_TTL_MS);
        return MOCK_SPORTS;
      }

      try {
        log('Fetching sports list');
        const url = `${this.config.baseUrl}/v4/sports/?apiKey=${this.config.apiKey}`;
        const res = await fetchWithTimeout(url);
        if (!res.ok) throw new OddsApiError(`Sports list request failed (${res.status})`, res.status);
        const data = (await res.json()) as RawSport[];
        log(`Received ${data.length} sports`);
        cache.set(cacheKey, data, SPORTS_LIST_TTL_MS);
        return data;
      } catch (err) {
        this.markBroken(err instanceof Error ? err.message : String(err));
        cache.set(cacheKey, MOCK_SPORTS, SPORTS_LIST_TTL_MS);
        return MOCK_SPORTS;
      }
    });
  }

  private async activeProviderKeysFor(sport: BetoraSport): Promise<string[]> {
    const sports = await this.getSports();
    return sports
      .filter((s) => s.active && SPORT_KEY_PREFIXES[sport].some((prefix) => s.key.startsWith(prefix)))
      .map((s) => s.key);
  }

  async getUpcomingEvents(sport: BetoraSport): Promise<RawEvent[]> {
    const cacheKey = `upcoming-${sport}`;
    const cached = cache.get<RawEvent[]>(cacheKey);
    if (cached) return cached;

    return cache.dedupe(cacheKey, async () => {
      if (this.mockMode) {
        log(`mock/demo mode — serving bundled upcoming events for ${sport}`);
        const events = MOCK_EVENTS.filter((e) => e.sport_key.startsWith(sport === 'football' ? 'soccer_' : `${sport}_`));
        cache.set(cacheKey, events, UPCOMING_EVENTS_TTL_MS);
        return events;
      }

      try {
        const providerKeys = await this.activeProviderKeysFor(sport);
        if (providerKeys.length === 0) {
          log(`No active competitions currently available for ${sport}`);
          cache.set(cacheKey, [], UPCOMING_EVENTS_TTL_MS);
          return [];
        }

        log(`Fetching ${sport} events across ${providerKeys.length} competitions`);
        const results = await Promise.allSettled(providerKeys.map((key) => this.fetchEventsForProviderKey(key)));

        const events: RawEvent[] = [];
        for (const r of results) {
          if (r.status === 'fulfilled') events.push(...r.value);
        }
        log(`Received ${events.length} ${sport} events`);
        cache.set(cacheKey, events, UPCOMING_EVENTS_TTL_MS);
        return events;
      } catch (err) {
        this.markBroken(err instanceof Error ? err.message : String(err));
        const events = MOCK_EVENTS.filter((e) => e.sport_key.startsWith(sport === 'football' ? 'soccer_' : `${sport}_`));
        cache.set(cacheKey, events, UPCOMING_EVENTS_TTL_MS);
        return events;
      }
    });
  }

  private async fetchEventsForProviderKey(providerKey: string): Promise<RawEvent[]> {
    const url =
      `${this.config.baseUrl}/v4/sports/${providerKey}/odds/` +
      `?apiKey=${this.config.apiKey}&regions=${this.config.region}&oddsFormat=${this.config.oddsFormat}&dateFormat=iso`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new OddsApiError(`API key rejected (${res.status})`, res.status);
      }
      log(`Competition ${providerKey} request failed (${res.status}) — skipping`);
      return [];
    }
    return (await res.json()) as RawEvent[];
  }

  async getLiveEvents(sport?: BetoraSport): Promise<RawEvent[]> {
    const cacheKey = `live-${sport ?? 'all'}`;
    const cached = cache.get<RawEvent[]>(cacheKey);
    if (cached) return cached;

    return cache.dedupe(cacheKey, async () => {
      if (this.mockMode) {
        log('mock/demo mode — serving bundled live events');
        cache.set(cacheKey, MOCK_LIVE_EVENTS, LIVE_EVENTS_TTL_MS);
        return MOCK_LIVE_EVENTS;
      }

      try {
        const sportsToCheck = sport ? [sport] : [...BETORA_SPORTS];
        const providerKeyGroups = await Promise.all(sportsToCheck.map((s) => this.activeProviderKeysFor(s)));
        const providerKeys = providerKeyGroups.flat();

        if (providerKeys.length === 0) {
          cache.set(cacheKey, [], LIVE_EVENTS_TTL_MS);
          return [];
        }

        log(`Checking live scores across ${providerKeys.length} competitions`);
        const results = await Promise.allSettled(providerKeys.map((key) => this.fetchScoresForProviderKey(key)));

        const events: RawEvent[] = [];
        for (const r of results) {
          if (r.status === 'fulfilled') events.push(...r.value);
        }
        const live = events.filter((e) => !e.completed && e.scores && e.scores.length > 0);
        log(`Received ${live.length} genuinely live events`);
        cache.set(cacheKey, live, LIVE_EVENTS_TTL_MS);
        return live;
      } catch (err) {
        this.markBroken(err instanceof Error ? err.message : String(err));
        cache.set(cacheKey, MOCK_LIVE_EVENTS, LIVE_EVENTS_TTL_MS);
        return MOCK_LIVE_EVENTS;
      }
    });
  }

  private async fetchScoresForProviderKey(providerKey: string): Promise<RawEvent[]> {
    const url = `${this.config.baseUrl}/v4/sports/${providerKey}/scores/?apiKey=${this.config.apiKey}&daysFrom=1`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const scored = (await res.json()) as RawEvent[];
    const withOdds = await this.fetchEventsForProviderKey(providerKey);
    const oddsById = new Map(withOdds.map((e) => [e.id, e]));
    return scored.map((s) => ({ ...s, bookmakers: oddsById.get(s.id)?.bookmakers ?? [] }));
  }

  async getEventById(sport: BetoraSport, eventId: string): Promise<RawEvent | null> {
    const cacheKey = `event-${eventId}`;
    const cached = cache.get<RawEvent | null>(cacheKey);
    if (cached !== undefined) return cached;

    return cache.dedupe(cacheKey, async () => {
      if (this.mockMode) {
        const found = MOCK_EVENTS.find((e) => e.id === eventId) ?? null;
        cache.set(cacheKey, found, SINGLE_EVENT_TTL_MS);
        return found;
      }

      const events = await this.getUpcomingEvents(sport);
      const found = events.find((e) => e.id === eventId) ?? null;
      cache.set(cacheKey, found, SINGLE_EVENT_TTL_MS);
      return found;
    });
  }
}
