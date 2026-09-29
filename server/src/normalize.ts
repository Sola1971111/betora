import type { RawOddsRow, RawSportEntry } from './rawTypes.js';
import type { NormalizedCompetition, NormalizedEvent, NormalizedMarket, NormalizedOutcome, NormalizedSport } from './types.js';
import { classifyMarket, parseLeagueId, isAllowedLeague, sharpSportToBetoraSport, SPORT_DISPLAY_NAMES } from './sportMapping.js';

export interface NormalizeConfig {
  defaultBookmaker: string; // SharpAPI sportsbook id, e.g. "pinnacle"; empty string = best-price aggregation
}

/**
 * SharpAPI's /odds returns one FLAT ROW per (sportsbook, event, market,
 * selection). This groups those rows back into one event per unique
 * event_id, with markets/outcomes nested underneath — the shape the rest
 * of Betora (and the frontend) already expects.
 */
export function normalizeOddsRows(
  rows: RawOddsRow[],
  config: NormalizeConfig,
  teamLogos: Record<string, string | null> = {}
): NormalizedEvent[] {
  const byEvent = new Map<string, RawOddsRow[]>();
  for (const row of rows) {
    if (!byEvent.has(row.event_id)) byEvent.set(row.event_id, []);
    byEvent.get(row.event_id)!.push(row);
  }

  const events: NormalizedEvent[] = [];

  for (const [eventId, eventRows] of byEvent) {
    const first = eventRows[0];
    const sport = sharpSportToBetoraSport(first.sport);
    if (!sport) continue;

    const preferredRows = config.defaultBookmaker
      ? eventRows.filter((r) => r.sportsbook === config.defaultBookmaker)
      : eventRows;
    // Fall back to all books for this event if the preferred one didn't cover it.
    const rowsToUse = preferredRows.length > 0 ? preferredRows : eventRows;

    // Group by market_type, then by outcome (selection + line), picking the
    // best available row per outcome: an active (non-suspended) price beats
    // a suspended one, and among equally-active rows the best decimal odds
    // wins — this is a "best price across real bookmakers" aggregation, it
    // never invents a price that wasn't actually returned.
    const byMarket = new Map<string, Map<string, RawOddsRow>>();
    let latestTimestamp = first.timestamp;

    for (const row of rowsToUse) {
      if (row.timestamp > latestTimestamp) latestTimestamp = row.timestamp;
      if (!byMarket.has(row.market_type)) byMarket.set(row.market_type, new Map());
      const outcomeMap = byMarket.get(row.market_type)!;
      const outcomeKey = `${row.selection}-${row.line ?? ''}`;
      const existing = outcomeMap.get(outcomeKey);

      if (!existing) {
        outcomeMap.set(outcomeKey, row);
        continue;
      }
      const existingActive = existing.is_active !== false;
      const rowActive = row.is_active !== false;
      if (rowActive && !existingActive) {
        outcomeMap.set(outcomeKey, row);
      } else if (rowActive === existingActive && row.odds_decimal > existing.odds_decimal) {
        outcomeMap.set(outcomeKey, row);
      }
    }

    const markets: NormalizedMarket[] = Array.from(byMarket.entries())
      .map(([marketType, outcomeMap]) => {
        const meta = classifyMarket(marketType);
        const outcomes: NormalizedOutcome[] = Array.from(outcomeMap.values()).map((row) => {
          const validPrice = Number.isFinite(row.odds_decimal) && row.odds_decimal > 1;
          return {
            id: `${marketType}-${row.selection}-${row.line ?? ''}`,
            name: row.selection,
            // is_active: false means the market is suspended — the price is
            // frozen upstream, so Betora treats it the same as "no price
            // available" (renders as SUSPENDED, never a stale/bettable button).
            price: row.is_active === false || !validPrice ? null : row.odds_decimal,
            point: row.line ?? null,
          } satisfies NormalizedOutcome;
        });
        return {
          id: marketType,
          key: marketType,
          title: meta.title,
          category: meta.category,
          priority: meta.priority,
          outcomes,
          lastUpdate: latestTimestamp,
        } satisfies NormalizedMarket;
      })
      // drop markets that ended up with zero valid, renderable outcomes
      .filter((m) => m.outcomes.some((o) => o.price !== null))
      // Main markets first, then category priority order, then each
      // market's own priority within its category — so the frontend can
      // trust array order rather than re-sorting client-side.
      .sort((a, b) => a.priority - b.priority);

    // Some providers bundle season-long outright/futures markets ("League
    // Winner", "Top Scorer") under the same league as real fixtures — these
    // aren't actual head-to-head matches and have no real home/away teams,
    // so Betora's match-card UI (built around two named teams) can't
    // represent them. Skip rather than show a broken/blank card for one.
    if (!first.home_team?.trim() || !first.away_team?.trim()) continue;

    const parsedLeague = parseLeagueId(first.league);

    // SharpAPI's /odds rows don't carry a live score — that comes from a
    // separate "Live Game State" endpoint not yet wired in. Left undefined
    // here rather than guessed; the frontend already handles a missing
    // liveScore gracefully (shows the LIVE badge without a score).
    const liveScore: NormalizedEvent['liveScore'] = undefined;
    const status: NormalizedEvent['status'] = first.is_live ? 'LIVE' : 'UPCOMING';

    events.push({
      id: eventId,
      sportKey: first.sport,
      sport,
      sportTitle: SPORT_DISPLAY_NAMES[sport],
      league: parsedLeague.competition,
      leagueKey: first.league,
      homeTeam: first.home_team,
      awayTeam: first.away_team,
      homeTeamLogo: teamLogos[first.home_team] ?? null,
      awayTeamLogo: teamLogos[first.away_team] ?? null,
      startTime: first.event_start_time,
      status,
      liveScore,
      bookmakerTitle: config.defaultBookmaker || 'Best Available',
      markets,
      totalMarketsCount: markets.length,
    });
  }

  return events;
}

export function normalizeSports(raw: RawSportEntry[]): NormalizedSport[] {
  const bySport = new Map<string, RawSportEntry[]>();
  for (const s of raw) {
    const betoraSport = sharpSportToBetoraSport(s.id);
    if (!betoraSport) continue;
    if (!bySport.has(betoraSport)) bySport.set(betoraSport, []);
    bySport.get(betoraSport)!.push(s);
  }
  return Array.from(bySport.entries()).map(([key, entries]) => ({
    key,
    providerKeys: entries.map((e) => e.id),
    name: SPORT_DISPLAY_NAMES[key as keyof typeof SPORT_DISPLAY_NAMES],
    active: entries.some((e) => e.event_count > 0),
  }));
}

/**
 * Every league SharpAPI reports for a sport, filtered down to that
 * sport's curated top-5 allowlist (see sportMapping.ts). Each gets a
 * parsed `country`/region so the frontend can group them (Sport →
 * Country → Competition) without ever hardcoding which leagues exist
 * beyond that curated list.
 */
export function normalizeCompetitions(raw: RawSportEntry[]): NormalizedCompetition[] {
  const competitions: NormalizedCompetition[] = [];
  for (const s of raw) {
    const betoraSport = sharpSportToBetoraSport(s.id);
    if (!betoraSport) continue;
    for (const leagueId of s.leagues) {
      if (!isAllowedLeague(betoraSport, leagueId)) continue;
      const parsed = parseLeagueId(leagueId);
      competitions.push({
        id: leagueId,
        name: parsed.competition,
        sport: betoraSport,
        country: parsed.region,
      });
    }
  }
  return competitions;
}
