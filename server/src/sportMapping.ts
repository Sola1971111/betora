// Maps Betora-facing sports to SharpAPI's own sport/league ids, and derives
// friendly display names. SharpAPI's /sports endpoint is the authoritative
// live list — this file only supplies the *grouping* (which SharpAPI sport
// id maps to which Betora sport) and label-formatting helpers.

export const BETORA_SPORTS = ['football', 'basketball', 'tennis'] as const;
export type BetoraSport = (typeof BETORA_SPORTS)[number];

// SharpAPI's own sport id -> Betora's internal sport slug. Confirmed via a
// live call: SharpAPI uses "soccer" for football/soccer, not "football"
// (that id is American football/NFL on this provider).
export const SHARP_SPORT_TO_BETORA: Record<string, BetoraSport> = {
  soccer: 'football',
  basketball: 'basketball',
  tennis: 'tennis',
};

export const SPORT_DISPLAY_NAMES: Record<BetoraSport, string> = {
  football: 'Football',
  basketball: 'Basketball',
  tennis: 'Tennis',
};

export function sharpSportToBetoraSport(sharpSportId: string): BetoraSport | null {
  return SHARP_SPORT_TO_BETORA[sharpSportId] ?? null;
}

/**
 * SharpAPI league ids mostly follow a `{region}_-_{competition}` pattern
 * (e.g. "england_-_premier_league", "usa_-_major_league_soccer"), but a
 * meaningful minority don't (e.g. "world_-_international_friendlies",
 * "fifa_-_world_cup", "women", "world_cup_2030"). This never hides a
 * league it can't parse cleanly — anything that doesn't split becomes its
 * own "International / Other" region rather than being dropped, per "the
 * API is the source of truth, don't invent or hide competitions."
 */
export interface ParsedLeague {
  id: string;
  region: string; // display name, e.g. "England"
  competition: string; // display name, e.g. "Premier League"
}

const KNOWN_ACRONYMS = new Set(['usa', 'us', 'uk', 'uae', 'uefa', 'fifa', 'nba', 'wnba', 'nfl', 'nhl', 'mlb', 'atp', 'wta', 'mls', 'u17', 'u19', 'u20', 'u21', 'u23']);

function titleCase(slug: string): string {
  return slug
    .split('_')
    .filter(Boolean)
    .map((w) => (KNOWN_ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

export function parseLeagueId(leagueId: string): ParsedLeague {
  const parts = leagueId.split('_-_');
  if (parts.length >= 2) {
    const [region, ...rest] = parts;
    return {
      id: leagueId,
      region: titleCase(region),
      competition: titleCase(rest.join('_-_')),
    };
  }
  return { id: leagueId, region: 'International / Other', competition: titleCase(leagueId) };
}

/**
 * The curated set of leagues Betora shows, per sport. Matched against the
 * PARSED display name (not raw provider ids), so it holds regardless of
 * the exact id string a provider happens to use.
 *
 * Trivially reversible/extendable — this is a config list, not an
 * architecture. Covers the world's biggest domestic football leagues plus
 * European/international competitions; basketball and tennis stay smaller
 * since they're a secondary focus for Betora.
 */
const TOP_LEAGUES_BY_SPORT: Record<BetoraSport, string[]> = {
  // Expanded from the earlier 5-league diagnostic set now that the actual
  // crash bug (empty team names on outright/futures "events") is fixed —
  // this costs zero extra requests, since it's still one league= filter
  // on the same single call per sport, just covering more inventory so
  // there's enough real match volume to show at any given moment.
  football: [
    'england premier league',
    'spain la liga',
    'italy serie a',
    'germany bundesliga',
    'france ligue 1',
    'netherlands eredivisie',
    'portugal primeira liga',
    'belgium pro league',
    'turkey super lig',
    'scotland premiership',
    'usa major league soccer',
    'brazil serie a',
    'argentina primera division',
    'mexico liga mx',
    'saudi pro league',
    // International/European competitions — matched by competition name
    // alone since these aren't tied to a single country.
    'champions league',
    'europa league',
    'conference league',
    'nations league',
    'world cup',
    'european championship',
    'copa america',
    'africa cup',
    'international friendlies',
  ],
  basketball: ['nba', 'wnba', 'ncaa', 'euroleague', 'acb'],
  tennis: ['atp', 'wta', 'australian open', 'french open', 'wimbledon', 'us open'],
};

export function isAllowedLeague(sport: BetoraSport, leagueId: string): boolean {
  const { region, competition } = parseLeagueId(leagueId);
  const full = `${region} ${competition}`.toLowerCase();

  // Age-group and youth competitions (U17/U19/U21/U23/junior) are always
  // excluded, even if they'd otherwise match a keyword below.
  if (/\bu1[7-9]\b|\bu2[0-3]\b|junior|youth/.test(full)) return false;

  const keywords = TOP_LEAGUES_BY_SPORT[sport] ?? [];
  return keywords.some((kw) => full.includes(kw));
}

// Market type -> friendly title + detail-page category, keyed by SharpAPI's
// own market_type strings. Anything not listed falls back to a title-cased
// version of the key under "Other" so unexpected markets the API adds
// later don't just disappear.
export const MARKET_META: Record<string, { title: string; category: string }> = {
  moneyline: { title: 'Match Result', category: 'Main' },
  spread: { title: 'Handicap', category: 'Handicap' },
  alternate_spread: { title: 'Alternate Handicap', category: 'Handicap' },
  total: { title: 'Total Goals', category: 'Goals' },
  alternate_total: { title: 'Alternate Totals', category: 'Goals' },
  btts: { title: 'Both Teams To Score', category: 'Goals' },
  both_teams_to_score: { title: 'Both Teams To Score', category: 'Goals' },
  draw_no_bet: { title: 'Draw No Bet', category: 'Main' },
  double_chance: { title: 'Double Chance', category: 'Main' },
  team_total: { title: 'Team Total', category: 'Goals' },
  correct_score: { title: 'Correct Score', category: 'Correct Score' },
};

export function marketMeta(key: string): { title: string; category: string } {
  if (MARKET_META[key]) return MARKET_META[key];
  return { title: titleCase(key), category: 'Other' };
}