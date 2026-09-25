// Maps Betora-facing sports to The Odds API's sport keys, and gives friendly
// display names for competitions. The Odds API's /v4/sports endpoint returns
// the authoritative live list (including which are currently in season) —
// this file only supplies the *grouping* (which provider keys count as
// "football" in Betora) and friendly names; availability itself is always
// checked live against /v4/sports rather than assumed here.

export const BETORA_SPORTS = ['football', 'basketball', 'tennis'] as const;
export type BetoraSport = (typeof BETORA_SPORTS)[number];

// Prefixes used by The Odds API sport keys for each Betora sport group.
// e.g. "soccer_epl", "soccer_uefa_champs_league" all start with "soccer_"
export const SPORT_KEY_PREFIXES: Record<BetoraSport, string[]> = {
  football: ['soccer_'],
  basketball: ['basketball_'],
  tennis: ['tennis_'],
};

export const SPORT_DISPLAY_NAMES: Record<BetoraSport, string> = {
  football: 'Football',
  basketball: 'Basketball',
  tennis: 'Tennis',
};

// Friendly display names for known competitions. Falls back to a
// title-cased version of the provider's own "title" field for anything
// not listed here, so new/seasonal competitions still render sensibly.
export const COMPETITION_DISPLAY_NAMES: Record<string, string> = {
  soccer_epl: 'Premier League',
  soccer_uefa_champs_league: 'Champions League',
  soccer_spain_la_liga: 'La Liga',
  soccer_italy_serie_a: 'Serie A',
  soccer_germany_bundesliga: 'Bundesliga',
  soccer_france_ligue_one: 'Ligue 1',
  soccer_usa_mls: 'MLS',
  soccer_saudi_pro_league: 'Saudi Pro League',
  soccer_netherlands_eredivisie: 'Eredivisie',
  soccer_portugal_primeira_liga: 'Primeira Liga',
  basketball_nba: 'NBA',
  basketball_wnba: 'WNBA',
  basketball_euroleague: 'EuroLeague',
  basketball_ncaab: 'NCAA Basketball',
  tennis_atp_aus_open_singles: 'ATP Australian Open',
  tennis_atp_french_open: 'ATP French Open',
  tennis_atp_wimbledon: 'ATP Wimbledon',
  tennis_atp_us_open: 'ATP US Open',
  tennis_wta_aus_open_singles: 'WTA Australian Open',
  tennis_wta_french_open: 'WTA French Open',
  tennis_wta_wimbledon: 'WTA Wimbledon',
  tennis_wta_us_open: 'WTA US Open',
};

export function sportKeyToBetoraSport(providerKey: string): BetoraSport | null {
  for (const sport of BETORA_SPORTS) {
    if (SPORT_KEY_PREFIXES[sport].some((prefix) => providerKey.startsWith(prefix))) {
      return sport;
    }
  }
  return null;
}

export function friendlyCompetitionName(providerKey: string, providerTitle: string): string {
  return COMPETITION_DISPLAY_NAMES[providerKey] ?? providerTitle;
}

// Market key -> friendly title + detail-page category, used by the
// normalization layer. Anything not listed falls back to a title-cased
// version of the key under the "Other" category so unexpected markets
// the API adds later don't just disappear.
export const MARKET_META: Record<string, { title: string; category: string }> = {
  h2h: { title: 'Match Result', category: 'Main' },
  h2h_3_way: { title: 'Match Result', category: 'Main' },
  totals: { title: 'Total Goals', category: 'Goals' },
  spreads: { title: 'Handicap', category: 'Handicap' },
  alternate_spreads: { title: 'Alternate Handicap', category: 'Handicap' },
  alternate_totals: { title: 'Alternate Totals', category: 'Goals' },
  btts: { title: 'Both Teams To Score', category: 'Goals' },
  draw_no_bet: { title: 'Draw No Bet', category: 'Main' },
  double_chance: { title: 'Double Chance', category: 'Main' },
  team_totals: { title: 'Team Total', category: 'Goals' },
};

export function marketMeta(key: string): { title: string; category: string } {
  if (MARKET_META[key]) return MARKET_META[key];
  const title = key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { title, category: 'Other' };
}
