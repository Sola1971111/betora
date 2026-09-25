import type { RawBookmaker, RawEvent, RawMarket, RawOutcome, RawSport } from './rawTypes.js';
import type { NormalizedCompetition, NormalizedEvent, NormalizedMarket, NormalizedOutcome, NormalizedSport } from './types.js';
import { friendlyCompetitionName, marketMeta, sportKeyToBetoraSport, type BetoraSport } from './sportMapping.js';

export interface NormalizeConfig {
  defaultBookmaker: string; // provider bookmaker key, e.g. "pinnacle"; empty string = best-price aggregation
}

function normalizeOutcome(marketKey: string, raw: RawOutcome): NormalizedOutcome {
  const price = typeof raw.price === 'number' && Number.isFinite(raw.price) && raw.price > 1 ? raw.price : null;
  const point = typeof raw.point === 'number' && Number.isFinite(raw.point) ? raw.point : null;
  return {
    id: `${marketKey}-${raw.name}-${point ?? ''}`,
    name: raw.name,
    price,
    point,
  };
}

/**
 * Picks which bookmaker's markets to surface for an event.
 * - If a DEFAULT_BOOKMAKER is configured and present, use it.
 * - Otherwise, synthesize a "best price" pseudo-bookmaker: for every
 *   market/outcome combination, take the highest price across all
 *   bookmakers returned for that event. This never fabricates markets —
 *   it only chooses the best real price among what was actually returned.
 */
function selectMarkets(bookmakers: RawBookmaker[], config: NormalizeConfig): { markets: RawMarket[]; sourceTitle: string | null; lastUpdate: string | null } {
  if (bookmakers.length === 0) return { markets: [], sourceTitle: null, lastUpdate: null };

  if (config.defaultBookmaker) {
    const preferred = bookmakers.find((b) => b.key === config.defaultBookmaker);
    if (preferred) {
      return { markets: preferred.markets, sourceTitle: preferred.title, lastUpdate: preferred.last_update };
    }
  }

  // Best-price aggregation across all returned bookmakers.
  const byMarketKey = new Map<string, Map<string, RawOutcome & { point?: number }>>();
  let latestUpdate: string | null = null;

  for (const bookmaker of bookmakers) {
    if (!latestUpdate || bookmaker.last_update > latestUpdate) latestUpdate = bookmaker.last_update;
    for (const market of bookmaker.markets) {
      if (!byMarketKey.has(market.key)) byMarketKey.set(market.key, new Map());
      const outcomeMap = byMarketKey.get(market.key)!;
      for (const outcome of market.outcomes) {
        const outcomeId = `${outcome.name}-${outcome.point ?? ''}`;
        const existing = outcomeMap.get(outcomeId);
        if (!existing || outcome.price > existing.price) {
          outcomeMap.set(outcomeId, outcome);
        }
      }
    }
  }

  const markets: RawMarket[] = Array.from(byMarketKey.entries()).map(([key, outcomeMap]) => ({
    key,
    last_update: latestUpdate ?? new Date().toISOString(),
    outcomes: Array.from(outcomeMap.values()),
  }));

  return { markets, sourceTitle: 'Best Available', lastUpdate: latestUpdate };
}

function normalizeMarket(raw: RawMarket): NormalizedMarket {
  const meta = marketMeta(raw.key);
  return {
    id: raw.key,
    key: raw.key,
    title: meta.title,
    category: meta.category,
    lastUpdate: raw.last_update ?? null,
    outcomes: raw.outcomes.map((o) => normalizeOutcome(raw.key, o)),
  };
}

export function normalizeEvent(
  raw: RawEvent,
  config: NormalizeConfig,
  isLive: boolean,
  teamLogos: Record<string, string | null> = {}
): NormalizedEvent | null {
  const sport = sportKeyToBetoraSport(raw.sport_key);
  if (!sport) return null; // not a sport Betora currently supports

  const { markets: rawMarkets, sourceTitle } = selectMarkets(raw.bookmakers, config);
  const markets = rawMarkets
    .map(normalizeMarket)
    // drop markets that ended up with zero valid, renderable outcomes
    .filter((m) => m.outcomes.some((o) => o.price !== null));

  const totalMarketsCount = raw.bookmakers.reduce((max, b) => Math.max(max, b.markets.length), markets.length);

  let liveScore: NormalizedEvent['liveScore'];
  if (isLive && raw.scores && raw.scores.length >= 2) {
    const homeScore = raw.scores.find((s) => s.name === raw.home_team);
    const awayScore = raw.scores.find((s) => s.name === raw.away_team);
    if (homeScore && awayScore) {
      liveScore = {
        home: Number(homeScore.score) || 0,
        away: Number(awayScore.score) || 0,
        minute: null,
      };
    }
  }

  const status: NormalizedEvent['status'] = raw.completed ? 'FINISHED' : isLive ? 'LIVE' : 'UPCOMING';

  return {
    id: raw.id,
    sportKey: raw.sport_key,
    sport,
    sportTitle: raw.sport_title,
    league: friendlyCompetitionName(raw.sport_key, raw.sport_title),
    leagueKey: raw.sport_key,
    homeTeam: raw.home_team,
    awayTeam: raw.away_team,
    homeTeamLogo: teamLogos[raw.home_team] ?? null,
    awayTeamLogo: teamLogos[raw.away_team] ?? null,
    startTime: raw.commence_time,
    status,
    liveScore,
    bookmakerTitle: sourceTitle,
    markets,
    totalMarketsCount,
  };
}

export function normalizeSports(raw: RawSport[]): NormalizedSport[] {
  const grouped = new Map<BetoraSport, string[]>();
  for (const s of raw) {
    if (!s.active) continue;
    const betoraSport = sportKeyToBetoraSport(s.key);
    if (!betoraSport) continue;
    if (!grouped.has(betoraSport)) grouped.set(betoraSport, []);
    grouped.get(betoraSport)!.push(s.key);
  }
  return Array.from(grouped.entries()).map(([key, providerKeys]) => ({
    key,
    providerKeys,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    active: providerKeys.length > 0,
  }));
}

export function normalizeCompetitions(raw: RawSport[]): NormalizedCompetition[] {
  return raw
    .filter((s) => s.active)
    .map((s) => {
      const sport = sportKeyToBetoraSport(s.key);
      if (!sport) return null;
      return {
        id: s.key,
        name: friendlyCompetitionName(s.key, s.title),
        sport,
      } satisfies NormalizedCompetition;
    })
    .filter((c): c is NormalizedCompetition => c !== null);
}
