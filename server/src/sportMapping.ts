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

// Market type -> friendly title + detail-page category + display order,
// keyed off SharpAPI's own market_type strings. This is deliberately
// PATTERN-based (keyword matching on the normalized key) rather than an
// exact-string lookup table: SharpAPI's exact key spelling for every
// market isn't fully confirmed, and a flat lookup silently dumps anything
// unrecognized into "Other" — which was the original complaint. Rules are
// tried in order and the first match wins, so more specific patterns
// (e.g. "half" + "moneyline") are listed before generic ones
// ("moneyline" alone) to avoid misclassifying half-time markets as Main.
interface MarketRule {
  test: (key: string) => boolean;
  category: string;
  title: (key: string) => string;
  priority: number; // display order within its category — lower shows first
}

function normKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function has(key: string, ...words: string[]): boolean {
  return words.every((w) => key.includes(w));
}

const MARKET_RULES: MarketRule[] = [
  // ---- HALF — checked early since these often also contain "moneyline"/
  // "total"/"double_chance", which would otherwise match a Main/Goals rule ----
  { test: (k) => has(k, 'half') && has(k, 'money') && (k.includes('first') || k.includes('1st') || k.includes('half_1')), category: 'Half', title: () => '1st Half Result', priority: 1 },
  { test: (k) => has(k, 'half') && has(k, 'money') && (k.includes('second') || k.includes('2nd') || k.includes('half_2')), category: 'Half', title: () => '2nd Half Result', priority: 2 },
  { test: (k) => has(k, 'half', 'double_chance') && (k.includes('first') || k.includes('1st')), category: 'Half', title: () => '1st Half Double Chance', priority: 3 },
  { test: (k) => has(k, 'half', 'double_chance') && (k.includes('second') || k.includes('2nd')), category: 'Half', title: () => '2nd Half Double Chance', priority: 4 },
  { test: (k) => (has(k, 'half_time') && has(k, 'full_time')) || k.includes('htft') || k === 'half_time_full_time', category: 'Half', title: () => 'Half-Time/Full-Time', priority: 5 },
  { test: (k) => has(k, 'half', 'total') && (k.includes('first') || k.includes('1st')), category: 'Half', title: () => '1st Half Total Goals', priority: 6 },
  { test: (k) => has(k, 'half', 'total') && (k.includes('second') || k.includes('2nd')), category: 'Half', title: () => '2nd Half Total Goals', priority: 7 },
  { test: (k) => k.includes('half'), category: 'Half', title: (k) => titleCase(k), priority: 20 }, // any other half-scoped market

  // ---- CORNERS ----
  { test: (k) => has(k, 'corner', 'total') || k === 'total_corners', category: 'Corners', title: () => 'Total Corners', priority: 1 },
  { test: (k) => has(k, 'corner', 'team') || k === 'team_corners', category: 'Corners', title: () => 'Team Corners', priority: 2 },
  { test: (k) => has(k, 'corner') && (k.includes('handicap') || k.includes('spread')), category: 'Corners', title: () => 'Corner Handicap', priority: 3 },
  { test: (k) => has(k, 'corner', 'first'), category: 'Corners', title: () => 'First Corner', priority: 4 },
  { test: (k) => has(k, 'corner', 'last'), category: 'Corners', title: () => 'Last Corner', priority: 5 },
  { test: (k) => has(k, 'corner') && (k.includes('odd') || k.includes('even')), category: 'Corners', title: () => 'Corner Odd/Even', priority: 6 },
  { test: (k) => k.includes('corner'), category: 'Corners', title: (k) => titleCase(k), priority: 20 },

  // ---- CARDS ----
  { test: (k) => has(k, 'card', 'total') || k === 'total_cards', category: 'Cards', title: () => 'Total Cards', priority: 1 },
  { test: (k) => has(k, 'card', 'team') || k === 'team_cards', category: 'Cards', title: () => 'Team Cards', priority: 2 },
  { test: (k) => has(k, 'card') && k.includes('handicap'), category: 'Cards', title: () => 'Card Handicap', priority: 3 },
  { test: (k) => has(k, 'card', 'first'), category: 'Cards', title: () => 'First Card', priority: 4 },
  { test: (k) => has(k, 'card', 'last'), category: 'Cards', title: () => 'Last Card', priority: 5 },
  { test: (k) => has(k, 'card') && (k.includes('odd') || k.includes('even')), category: 'Cards', title: () => 'Card Odd/Even', priority: 6 },
  { test: (k) => k.includes('card'), category: 'Cards', title: (k) => titleCase(k), priority: 20 },

  // ---- TEAM (team-specific props that aren't goals/corners/cards) ----
  { test: (k) => k.includes('clean_sheet'), category: 'Team', title: () => 'Clean Sheet', priority: 1 },
  { test: (k) => has(k, 'win') && k.includes('nil'), category: 'Team', title: () => 'Win To Nil', priority: 2 },

  // ---- PLAYER ----
  { test: (k) => k.includes('player') || k.includes('goalscorer') || k.includes('scorer') || k.includes('assist'), category: 'Player', title: (k) => titleCase(k), priority: 10 },

  // ---- HANDICAP ----
  { test: (k) => k.includes('spread') || k.includes('handicap'), category: 'Handicap', title: () => 'Handicap', priority: 1 },

  // ---- CORRECT SCORE ----
  { test: (k) => k.includes('correct_score'), category: 'Correct Score', title: () => 'Correct Score', priority: 1 },

  // ---- GOALS ----
  { test: (k) => k === 'total' || (k.includes('total') && k.includes('goal')) || k.includes('match_result_total_goal'), category: 'Goals', title: () => 'Total Goals', priority: 1 },
  { test: (k) => k.includes('btts') || k.includes('both_teams'), category: 'Goals', title: () => 'Both Teams To Score', priority: 2 },
  { test: (k) => k.includes('team_total'), category: 'Goals', title: () => 'Team Total Goals', priority: 3 },
  { test: (k) => k.includes('exact_goal'), category: 'Goals', title: () => 'Exact Goals', priority: 4 },
  { test: (k) => k.includes('goal_range') || k.includes('goal_band'), category: 'Goals', title: () => 'Goal Range', priority: 5 },
  { test: (k) => k.includes('first_goal') || k.includes('last_goal'), category: 'Goals', title: (k) => (k.includes('first') ? 'First Goal' : 'Last Goal'), priority: 6 },
  { test: (k) => k.includes('total') || k.includes('goal'), category: 'Goals', title: (k) => titleCase(k), priority: 20 },

  // ---- MAIN ----
  { test: (k) => k === 'moneyline' || k === 'h2h' || k === 'match_result' || k === '1x2', category: 'Main', title: () => 'Match Result', priority: 1 },
  { test: (k) => k.includes('double_chance'), category: 'Main', title: () => 'Double Chance', priority: 2 },
  { test: (k) => k.includes('draw_no_bet'), category: 'Main', title: () => 'Draw No Bet', priority: 3 },
  { test: (k) => k.includes('winning_margin'), category: 'Main', title: () => 'Winning Margin', priority: 4 },
];

export interface MarketClassification {
  title: string;
  category: string;
  priority: number;
}

export function classifyMarket(rawKey: string): MarketClassification {
  const key = normKey(rawKey);
  for (const rule of MARKET_RULES) {
    if (rule.test(key)) return { title: rule.title(key), category: rule.category, priority: rule.priority };
  }
  return { title: titleCase(key), category: 'Other', priority: 99 };
}
