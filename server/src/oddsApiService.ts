import type { RawOddsRow, RawOddsResponse, RawSportEntry, RawSportsResponse } from './rawTypes.js';
import { MOCK_ODDS_ROWS, MOCK_SPORTS } from './mockData.js';
import { TtlCache } from './cache.js';
import { requestGovernor } from './requestGovernor.js';
import { BETORA_SPORTS, isAllowedLeague, sharpSportToBetoraSport, type BetoraSport } from './sportMapping.js';

export interface OddsApiConfig {
  apiKey: string;
  baseUrl: string; // https://api.sharpapi.io/api/v1
  useMockData: boolean;
}

const FETCH_TIMEOUT_MS = 8000;
// SharpAPI's account limit is 12 requests/minute, shared across every
// Betora user — caching is the primary defense, not a nice-to-have.
// League/sport metadata barely changes; cache it for a long time.
const SPORTS_LIST_TTL_MS = 60 * 60_000; // 1 hour
const UPCOMING_EVENTS_TTL_MS = 3 * 60_000; // 3 minutes
const LIVE_EVENTS_TTL_MS = 20_000; // 20 seconds
const BROKEN_KEY_COOLDOWN_MS = 5 * 60_000; // stop hammering a known-broken key for 5 minutes
// With league= filtering doing the heavy lifting, results should mostly
// fit in one page; this is a safety cap for busy periods, not the norm.
const MAX_PAGES = 2;

// Betora's sport slug -> SharpAPI's own sport id, e.g. "football" -> "soccer".
// (Confirmed live: SharpAPI's "football" id is American football/NFL, not
// soccer — this mapping is what keeps Betora's football pages showing the
// right sport.)
const BETORA_SPORT_TO_SHARP: Record<BetoraSport, string> = {
  football: 'soccer',
  basketball: 'basketball',
  tennis: 'tennis',
};

const cache = new TtlCache();

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('[SHARPAPI]', ...args);
}

async function fetchWithTimeout(url: string, apiKey: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { headers: { 'X-API-Key': apiKey }, signal: controller.signal });
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

/** Thrown when the request governor refuses a call — the 12/min budget is
 * already spent for this window. Distinct from OddsApiError so callers can
 * tell "SharpAPI said no" apart from "we chose not to ask." */
export class BudgetExhaustedError extends Error {
  constructor() {
    super('Request budget exhausted for this window');
  }
}

export class OddsApiService {
  private brokenUntil = 0;
  // /sports' real league list, filtered down to our curated allowlist —
  // gives us EXACT confirmed league id strings to pass via SharpAPI's own
  // league= filter, instead of guessing them. Cached alongside /sports.
  private allowedLeagueIdsCache = new Map<BetoraSport, string[]>();

  constructor(private config: OddsApiConfig) {}

  private get mockMode(): boolean {
    return this.config.useMockData || !this.config.apiKey || Date.now() < this.brokenUntil;
  }

  private markBroken(reason: string) {
    if (this.brokenUntil < Date.now()) {
      log(`WARNING: real API call failed (${reason}) — serving demo data for the next 5 minutes. Check that SharpAPI's key is valid.`);
    }
    this.brokenUntil = Date.now() + BROKEN_KEY_COOLDOWN_MS;
  }

  /** Every actual upstream call funnels through here so the governor check
   * and spend are never accidentally skipped by a new code path later. */
  private async governedFetch(url: string): Promise<Response> {
    if (!requestGovernor.canSpend()) {
      throw new BudgetExhaustedError();
    }
    requestGovernor.spend();
    return fetchWithTimeout(url, this.config.apiKey);
  }

  async getSports(): Promise<RawSportEntry[]> {
    const cacheKey = 'sports-list';
    const cached = cache.get<RawSportEntry[]>(cacheKey);
    if (cached) return cached;

    return cache.dedupe(cacheKey, async () => {
      if (this.mockMode) {
        log('mock/demo mode — serving bundled sports list');
        cache.set(cacheKey, MOCK_SPORTS, SPORTS_LIST_TTL_MS);
        return MOCK_SPORTS;
      }

      try {
        log('Fetching sports list');
        const res = await this.governedFetch(`${this.config.baseUrl}/sports`);
        if (!res.ok) throw new OddsApiError(`Sports list request failed (${res.status})`, res.status);
        const body = (await res.json()) as RawSportsResponse;
        if (!Array.isArray(body?.data)) throw new OddsApiError('Unexpected /sports response shape');
        log(`Received ${body.data.length} sports`);
        cache.set(cacheKey, body.data, SPORTS_LIST_TTL_MS);
        return body.data;
      } catch (err) {
        const stale = cache.getStale<RawSportEntry[]>(cacheKey);
        if (stale) {
          log(`/sports fetch failed (${err instanceof Error ? err.message : err}) — serving last-known data`);
          return stale;
        }
        if (!(err instanceof BudgetExhaustedError)) this.markBroken(err instanceof Error ? err.message : String(err));
        cache.set(cacheKey, MOCK_SPORTS, SPORTS_LIST_TTL_MS);
        return MOCK_SPORTS;
      }
    });
  }

  /** The exact real league id strings (from SharpAPI's own /sports data)
   * that match this sport's curated top-5 allowlist — used to ask
   * SharpAPI for only those leagues via its league= filter, instead of
   * paginating through everything and filtering client-side. */
  private async getAllowedLeagueIds(sport: BetoraSport): Promise<string[]> {
    if (this.allowedLeagueIdsCache.has(sport)) return this.allowedLeagueIdsCache.get(sport)!;
    const sharpSportId = BETORA_SPORT_TO_SHARP[sport];
    const allSports = await this.getSports();
    const entry = allSports.find((s) => s.id === sharpSportId);
    const ids = (entry?.leagues ?? []).filter((id) => isAllowedLeague(sport, id));
    this.allowedLeagueIdsCache.set(sport, ids);
    return ids;
  }

  /**
   * Fetches odds rows for a sport, paginating up to MAX_PAGES as a safety
   * cap. Passes league= (SharpAPI's own documented filter) with the exact
   * curated league ids for that sport when known, so SharpAPI does the
   * filtering upstream — far fewer rows returned, far fewer pages needed —
   * rather than fetching everything and discarding most of it client-side.
   */
  private async fetchAllOddsRows(sport: BetoraSport, live?: boolean): Promise<RawOddsRow[]> {
    const sharpSportId = BETORA_SPORT_TO_SHARP[sport];
    const allowedIds = await this.getAllowedLeagueIds(sport);

    const rows: RawOddsRow[] = [];
    let offset = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const params = new URLSearchParams({ sport: sharpSportId, limit: '500', offset: String(offset) });
      if (live !== undefined) params.set('live', String(live));
      if (allowedIds.length > 0) params.set('league', allowedIds.join(','));
      const url = `${this.config.baseUrl}/odds?${params.toString()}`;
      const res = await this.governedFetch(url);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new OddsApiError(`API key rejected (${res.status})`, res.status);
        }
        if (res.status === 429) {
          // Rate limited — never retry immediately. Throw so the caller
          // falls back to last-known-good cached data instead.
          const retryAfter = res.headers.get('retry-after');
          log(`Rate limited (429) for sport=${sharpSportId}${retryAfter ? `, retry-after=${retryAfter}s` : ''} — stopping, no retry`);
          throw new OddsApiError('Rate limited by SharpAPI (429)', 429);
        }
        log(`Odds request failed (${res.status}) for sport=${sharpSportId} — stopping pagination here`);
        break;
      }
      const body = (await res.json()) as RawOddsResponse;
      if (!Array.isArray(body?.data)) {
        log(`Unexpected /odds response shape for sport=${sharpSportId} — stopping`);
        break;
      }
      // Client-side filter kept as a safety net even with league= applied
      // server-side — covers the case where allowedIds is empty (not yet
      // resolved) and we fetched broadly instead.
      const pageRows = allowedIds.length > 0 ? body.data : body.data.filter((r) => isAllowedLeague(sport, r.league));
      rows.push(...pageRows);
      if (!body.pagination?.has_more) break;
      offset = body.pagination.next_offset ?? offset + 500;
    }
    return rows;
  }

  async getUpcomingEvents(sport: BetoraSport): Promise<RawOddsRow[]> {
    const cacheKey = `upcoming-${sport}`;
    const cached = cache.get<RawOddsRow[]>(cacheKey);
    if (cached) return cached;

    return cache.dedupe(cacheKey, async () => {
      if (this.mockMode) {
        log(`mock/demo mode — serving bundled upcoming events for ${sport}`);
        const rows = MOCK_ODDS_ROWS.filter((r) => sharpSportToBetoraSport(r.sport) === sport && !r.is_live);
        cache.set(cacheKey, rows, UPCOMING_EVENTS_TTL_MS);
        return rows;
      }

      try {
        log(`Fetching upcoming ${sport} odds`);
        const rows = await this.fetchAllOddsRows(sport, false);
        log(`Received ${rows.length} upcoming ${sport} odds rows`);
        cache.set(cacheKey, rows, UPCOMING_EVENTS_TTL_MS);
        return rows;
      } catch (err) {
        // A rate limit (or a skipped call because the budget's spent) is
        // temporary — don't force 5 minutes of mock data over it. Serve
        // the last known-good real data if we have it; only fall to mock
        // if nothing's cached yet.
        if (err instanceof OddsApiError && err.status === 429) {
          log(`Rate limited fetching ${sport} — serving last-known data instead of failing`);
        } else if (err instanceof BudgetExhaustedError) {
          log(`Request budget spent — serving last-known ${sport} data instead of fetching`);
        } else {
          this.markBroken(err instanceof Error ? err.message : String(err));
        }
        const stale = cache.getStale<RawOddsRow[]>(cacheKey);
        if (stale) return stale;
        const rows = MOCK_ODDS_ROWS.filter((r) => sharpSportToBetoraSport(r.sport) === sport && !r.is_live);
        cache.set(cacheKey, rows, UPCOMING_EVENTS_TTL_MS);
        return rows;
      }
    });
  }

  async getLiveEvents(sport?: BetoraSport): Promise<RawOddsRow[]> {
    const cacheKey = `live-${sport ?? 'all'}`;
    const cached = cache.get<RawOddsRow[]>(cacheKey);
    if (cached) return cached;

    return cache.dedupe(cacheKey, async () => {
      if (this.mockMode) {
        log('mock/demo mode — serving bundled live events');
        const rows = MOCK_ODDS_ROWS.filter((r) => r.is_live && (!sport || sharpSportToBetoraSport(r.sport) === sport));
        cache.set(cacheKey, rows, LIVE_EVENTS_TTL_MS);
        return rows;
      }

      try {
        // Live matches are the highest priority per the request budget —
        // but still bounded to the sports actually asked for, never "all
        // three, always," to avoid spending the whole minute's budget on
        // one poll.
        const sportsToCheck = sport ? [sport] : [...BETORA_SPORTS];
        log(`Checking live odds across ${sportsToCheck.length} sport(s)`);
        const results = await Promise.allSettled(sportsToCheck.map((s) => this.fetchAllOddsRows(s, true)));
        const rows: RawOddsRow[] = [];
        let anyRateLimited = false;
        for (const r of results) {
          if (r.status === 'fulfilled') rows.push(...r.value);
          else if (r.reason instanceof OddsApiError && r.reason.status === 429) anyRateLimited = true;
          else if (r.reason instanceof BudgetExhaustedError) anyRateLimited = true;
        }
        log(`Received ${rows.length} live odds rows`);
        if (rows.length === 0 && anyRateLimited) {
          const stale = cache.getStale<RawOddsRow[]>(cacheKey);
          if (stale) return stale;
          log('Rate limited with no cached live data yet — serving demo data for this request');
          const mockRows = MOCK_ODDS_ROWS.filter((r) => r.is_live && (!sport || sharpSportToBetoraSport(r.sport) === sport));
          cache.set(cacheKey, mockRows, LIVE_EVENTS_TTL_MS);
          return mockRows;
        }
        cache.set(cacheKey, rows, LIVE_EVENTS_TTL_MS);
        return rows;
      } catch (err) {
        if (!(err instanceof OddsApiError && err.status === 429) && !(err instanceof BudgetExhaustedError)) {
          this.markBroken(err instanceof Error ? err.message : String(err));
        }
        const stale = cache.getStale<RawOddsRow[]>(cacheKey);
        if (stale) return stale;
        const rows = MOCK_ODDS_ROWS.filter((r) => r.is_live && (!sport || sharpSportToBetoraSport(r.sport) === sport));
        cache.set(cacheKey, rows, LIVE_EVENTS_TTL_MS);
        return rows;
      }
    });
  }

  /**
   * A single event's odds rows. SharpAPI's dedicated per-event endpoint
   * hasn't been confirmed against a live response yet, so this reuses the
   * already-fetched (and cached) upcoming/live lists and filters by
   * event_id — costs zero extra requests beyond what Home/Live already do.
   */
  async getEventRows(sport: BetoraSport, eventId: string): Promise<RawOddsRow[]> {
    const [upcoming, live] = await Promise.all([this.getUpcomingEvents(sport), this.getLiveEvents(sport)]);
    const all = [...upcoming, ...live];
    return all.filter((r) => r.event_id === eventId);
  }
}
