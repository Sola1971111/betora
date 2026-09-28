import type { RawOddsRow, RawOddsResponse, RawSportEntry, RawSportsResponse } from './rawTypes.js';
import { MOCK_ODDS_ROWS, MOCK_SPORTS } from './mockData.js';
import { TtlCache } from './cache.js';
import { BETORA_SPORTS, isAllowedLeague, sharpSportToBetoraSport, type BetoraSport } from './sportMapping.js';

export interface OddsApiConfig {
  apiKey: string;
  baseUrl: string; // https://api.sharpapi.io/api/v1
  useMockData: boolean;
}

const FETCH_TIMEOUT_MS = 8000;
const SPORTS_LIST_TTL_MS = 10 * 60_000;
const UPCOMING_EVENTS_TTL_MS = 60_000;
const LIVE_EVENTS_TTL_MS = 10_000;
const BROKEN_KEY_COOLDOWN_MS = 5 * 60_000; // stop hammering a known-broken key for 5 minutes
const MAX_PAGES = 3; // safety cap — 3 * 500 = up to 1500 rows per call

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

export class OddsApiService {
  private brokenUntil = 0;

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
        const res = await fetchWithTimeout(`${this.config.baseUrl}/sports`, this.config.apiKey);
        if (!res.ok) throw new OddsApiError(`Sports list request failed (${res.status})`, res.status);
        const body = (await res.json()) as RawSportsResponse;
        log(`Received ${body.data.length} sports`);
        cache.set(cacheKey, body.data, SPORTS_LIST_TTL_MS);
        return body.data;
      } catch (err) {
        this.markBroken(err instanceof Error ? err.message : String(err));
        cache.set(cacheKey, MOCK_SPORTS, SPORTS_LIST_TTL_MS);
        return MOCK_SPORTS;
      }
    });
  }

  /**
   * Fetches every odds row for a sport, paginating up to MAX_PAGES. For
   * soccer specifically, rows are filtered down to the curated
   * top-leagues + European/international allowlist as each page comes in
   * — not just after the fact — so memory never holds the full unfiltered
   * set even transiently. Other sports (basketball, tennis) aren't
   * filtered; they don't have soccer's hundreds-of-leagues problem.
   */
  private async fetchAllOddsRows(sharpSportId: string, live?: boolean): Promise<RawOddsRow[]> {
    const rows: RawOddsRow[] = [];
    let offset = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const params = new URLSearchParams({ sport: sharpSportId, limit: '500', offset: String(offset) });
      if (live !== undefined) params.set('live', String(live));
      const url = `${this.config.baseUrl}/odds?${params.toString()}`;
      const res = await fetchWithTimeout(url, this.config.apiKey);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new OddsApiError(`API key rejected (${res.status})`, res.status);
        }
        log(`Odds request failed (${res.status}) for sport=${sharpSportId} — stopping pagination here`);
        break;
      }
      const body = (await res.json()) as RawOddsResponse;
      const pageRows = sharpSportId === 'soccer' ? body.data.filter((r) => isAllowedLeague(r.league)) : body.data;
      rows.push(...pageRows);
      if (!body.pagination.has_more) break;
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

      const sharpSportId = BETORA_SPORT_TO_SHARP[sport];
      try {
        log(`Fetching upcoming ${sport} (sport=${sharpSportId}) odds`);
        const rows = await this.fetchAllOddsRows(sharpSportId, false);
        log(`Received ${rows.length} upcoming ${sport} odds rows`);
        cache.set(cacheKey, rows, UPCOMING_EVENTS_TTL_MS);
        return rows;
      } catch (err) {
        this.markBroken(err instanceof Error ? err.message : String(err));
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
        const sportsToCheck = sport ? [sport] : [...BETORA_SPORTS];
        log(`Checking live odds across ${sportsToCheck.length} sport(s)`);
        const results = await Promise.allSettled(
          sportsToCheck.map((s) => this.fetchAllOddsRows(BETORA_SPORT_TO_SHARP[s], true))
        );
        const rows: RawOddsRow[] = [];
        for (const r of results) {
          if (r.status === 'fulfilled') rows.push(...r.value);
        }
        log(`Received ${rows.length} live odds rows`);
        cache.set(cacheKey, rows, LIVE_EVENTS_TTL_MS);
        return rows;
      } catch (err) {
        this.markBroken(err instanceof Error ? err.message : String(err));
        const rows = MOCK_ODDS_ROWS.filter((r) => r.is_live && (!sport || sharpSportToBetoraSport(r.sport) === sport));
        cache.set(cacheKey, rows, LIVE_EVENTS_TTL_MS);
        return rows;
      }
    });
  }

  /**
   * A single event's odds rows. SharpAPI's dedicated per-event endpoint
   * hasn't been confirmed against a live response yet, so this reuses the
   * already-fetched upcoming/live lists and filters by event_id — slightly
   * less efficient, but only built against confirmed, tested behavior.
   */
  async getEventRows(sport: BetoraSport, eventId: string): Promise<RawOddsRow[]> {
    const [upcoming, live] = await Promise.all([this.getUpcomingEvents(sport), this.getLiveEvents(sport)]);
    const all = [...upcoming, ...live];
    return all.filter((r) => r.event_id === eventId);
  }
}
