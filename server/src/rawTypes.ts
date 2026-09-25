// Raw shapes as returned by The Odds API v4. Kept isolated here so the rest
// of the server never has to know provider-specific field names — only
// normalize.ts should import from this file.

export interface RawSport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface RawOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface RawMarket {
  key: string;
  last_update: string;
  outcomes: RawOutcome[];
}

export interface RawBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: RawMarket[];
}

export interface RawEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: RawBookmaker[];
  // Present only on /v4/sports/{sport}/scores responses, not /odds responses
  completed?: boolean;
  scores?: { name: string; score: string }[] | null;
  last_update?: string | null;
}
