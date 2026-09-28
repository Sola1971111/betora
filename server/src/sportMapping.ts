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
 * The curated set of leagues Betora actually shows: the world's ~20
 * biggest domestic leagues, plus every European and international
 * competition. This is matched against the PARSED display name (not raw
 * provider ids), so it holds regardless of the exact id string a provider
 * happens to use — a league only needs its region and competition name to
 * both contain the listed keywords.
 *
 * This exists purely to keep the dataset a sane size end-to-end (fetch,
 * memory, payload, render) — it does not mean Betora "can't support" other
 * leagues; extending this list is a one-line addition, not a rearchitecture.
 */
const TOP_DOMESTIC_LEAGUES: { region: string; competition: string }[] = [
  { region: 'england', competition: 'premier league' },
  { region: 'spain', competition: 'la liga' },
  { region: 'italy', competition: 'serie a' },
  { region: 'germany', competition: 'bundesliga' },
  { region: 'france', competition: 'ligue 1' },
  { region: 'netherlands', competition: 'eredivisie' },
  { region: 'portugal', competition: 'primeira liga' },
  { region: 'belgium', competition: 'pro league' },
  { region: 'turkey', competition: 'super lig' },
  { region: 'scotland', competition: 'premiership' },
  { region: 'usa', competition: 'major league soccer' },
  { region: 'brazil', competition: 'serie a' },
  { region: 'argentina', competition: 'primera division' },
  { region: 'mexico', competition: 'liga mx' },
  { region: 'saudi', competition: 'pro league' },
  { region: 'japan', competition: 'j1 league' },
  { region: 'south korea', competition: 'k league' },
  { region: 'australia', competition: 'a-league' },
  { region: 'china', competition: 'super league' },
  { region: 'greece', competition: 'super league' },
];

// Competitions that aren't tied to one country — matched by competition
// name alone, since these typically show up under "World", "UEFA", "FIFA",
// or similar region groupings rather than a single nation.
const INTERNATIONAL_KEYWORDS = [
  'champions league',
  'europa league',
  'conference league',
  'nations league',
  'world cup',
  'european championship',
  'euro qualif',
  'copa america',
  'africa cup',
  'afcon',
  'gold cup',
  'international friendlies',
  'world cup qualif',
];

export function isAllowedLeague(leagueId: string): boolean {
  const { region, competition } = parseLeagueId(leagueId);
  const r = region.toLowerCase();
  const c = competition.toLowerCase();

  // Age-group and youth competitions (U17/U19/U21/U23/junior) are excluded
  // even when they'd otherwise match a keyword below — "top leagues plus
  // European/international competitions" means the senior competitions.
  if (/\bu1[7-9]\b|\bu2[0-3]\b|junior|youth/.test(c)) return false;

  if (TOP_DOMESTIC_LEAGUES.some((l) => r.includes(l.region) && c.includes(l.competition))) return true;
  if (INTERNATIONAL_KEYWORDS.some((kw) => c.includes(kw))) return true;
  return false;
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
