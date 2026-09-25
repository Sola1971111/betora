// Mirrors server/src/types.ts — kept as a plain duplicate since frontend and
// server are separate deployables with no shared package in this project.

export type ApiEventStatus = 'UPCOMING' | 'LIVE' | 'FINISHED';

export interface ApiOutcome {
  id: string;
  name: string;
  price: number | null;
  point: number | null;
}

export interface ApiMarket {
  id: string;
  key: string;
  title: string;
  category: string;
  outcomes: ApiOutcome[];
  lastUpdate: string | null;
}

export interface ApiEvent {
  id: string;
  sportKey: string;
  sport: 'football' | 'basketball' | 'tennis';
  sportTitle: string;
  league: string;
  leagueKey: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  startTime: string;
  status: ApiEventStatus;
  liveScore?: { home: number; away: number; minute?: number | null };
  bookmakerTitle: string | null;
  markets: ApiMarket[];
  totalMarketsCount: number;
}

export interface ApiSport {
  key: string;
  providerKeys: string[];
  name: string;
  active: boolean;
}

export interface ApiCompetition {
  id: string;
  name: string;
  sport: 'football' | 'basketball' | 'tennis';
  country?: string;
}

export interface ApiSportsResponse {
  sports: ApiSport[];
  competitions: ApiCompetition[];
  config: { liveOddsRefreshIntervalMs: number };
}

export interface ApiEventsResponse {
  events: ApiEvent[];
}

export interface ApiEventResponse {
  event: ApiEvent;
}

export interface ApiErrorResponse {
  error: string;
  detail?: string;
}
