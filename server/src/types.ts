// Internal normalized shapes. These are provider-independent: nothing outside
// odds-api.ts should ever see a raw The-Odds-API response shape.

export type EventStatus = 'UPCOMING' | 'LIVE' | 'FINISHED';

export interface NormalizedOutcome {
  id: string; // stable id: `${marketKey}-${name}-${point ?? ''}`
  name: string; // "Arsenal", "Over", "Home -1.5"
  price: number | null; // decimal odds; null if unavailable/suspended
  point: number | null; // handicap/total line, if applicable
}

export interface NormalizedMarket {
  id: string; // same as key, kept separate in case we need synthetic ids later
  key: string; // "h2h", "totals", "spreads", ...
  title: string; // human-friendly: "Match Result", "Total Goals", "Handicap"
  category: string; // grouping used for match-detail tabs: "Main", "Goals", "Handicap", "Other"
  priority: number; // display order within its category — lower shows first
  outcomes: NormalizedOutcome[];
  lastUpdate: string | null; // ISO timestamp from the bookmaker
}

export interface NormalizedEvent {
  id: string;
  sportKey: string; // provider key, e.g. "soccer_epl"
  sport: 'football' | 'basketball' | 'tennis';
  sportTitle: string; // "Football", "Basketball", "Tennis"
  league: string; // friendly competition name, e.g. "Premier League"
  leagueKey: string; // raw provider sport key, kept for debugging/admin only
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string | null; // crest/badge image URL, null if unavailable — never blocks rendering
  awayTeamLogo: string | null;
  startTime: string; // ISO
  status: EventStatus;
  liveScore?: { home: number; away: number; minute?: number | null };
  bookmakerTitle: string | null; // which bookmaker the displayed odds came from ("best" if aggregated)
  markets: NormalizedMarket[];
  totalMarketsCount: number;
}

export interface NormalizedSport {
  key: string; // "football" | "basketball" | "tennis" (Betora-facing)
  providerKeys: string[]; // underlying The-Odds-API sport keys grouped under this Betora sport
  name: string;
  active: boolean;
}

export interface NormalizedCompetition {
  id: string; // provider sport key, e.g. "soccer_epl"
  name: string; // "Premier League"
  sport: 'football' | 'basketball' | 'tennis';
  country?: string;
}
