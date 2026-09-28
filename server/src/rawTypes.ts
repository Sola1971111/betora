// Raw shapes as returned by SharpAPI v1. Kept isolated here so the rest of
// the server never has to know provider-specific field names — only
// normalize.ts should import from this file.
//
// Unlike the previous provider (The Odds API), SharpAPI's /odds endpoint
// returns a FLAT list — one row per (sportsbook, event, market, selection)
// combination — rather than nested events-with-bookmakers-with-markets.
// normalize.ts is responsible for grouping these back into one event per
// unique event_id.

export interface RawOddsRow {
  id: string;
  sportsbook: string;
  event_id: string;
  event_uuid?: string;
  sport: string; // e.g. "soccer", "basketball" — SharpAPI's own sport id
  league: string; // e.g. "england_-_premier_league"
  home_team: string;
  away_team: string;
  market_type: string; // e.g. "moneyline", "spread", "total"
  selection: string; // display label, e.g. "Boston Celtics", "Over 2.5"
  selection_type?: 'home' | 'away' | 'draw' | string;
  odds_american: number;
  odds_decimal: number;
  odds_probability: number;
  line: number | null;
  event_start_time: string;
  timestamp: string;
  is_live: boolean;
  // true (default) = bettable; false = suspended, price frozen at last value
  is_active?: boolean;
  is_main_line?: boolean;
}

export interface RawOddsRemoved {
  id: string;
  sportsbook: string;
  removed_at: string;
  event_start?: string;
  was_live?: boolean;
  boundary?: boolean;
}

export interface RawOddsResponse {
  data: RawOddsRow[];
  removed?: RawOddsRemoved[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
    has_more: boolean;
    next_offset: number | null;
    next_cursor: string | null;
  };
  updated_at: string;
  meta: { server_time: string };
}

export interface RawSportEntry {
  id: string; // e.g. "soccer", "basketball"
  name: string;
  event_count: number;
  live_count: number;
  leagues: string[]; // flat league id strings, e.g. "england_-_premier_league"
}

export interface RawSportsResponse {
  data: RawSportEntry[];
}
