import type { RawOddsRow, RawSportEntry } from './rawTypes.js';

export const MOCK_SPORTS: RawSportEntry[] = [
  {
    id: 'soccer',
    name: 'Soccer',
    event_count: 25,
    live_count: 2,
    leagues: [
      'england_-_premier_league',
      'spain_-_la_liga',
      'italy_-_serie_a',
      'germany_-_bundesliga',
      'france_-_ligue_1',
    ],
  },
  { id: 'basketball', name: 'Basketball', event_count: 5, live_count: 0, leagues: ['usa_-_nba'] },
  { id: 'tennis', name: 'Tennis', event_count: 3, live_count: 0, leagues: ['atp_-_us_open'] },
];

function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3600_000).toISOString();
}

let mockRowId = 1;

function oddsRow(params: {
  eventId: string;
  sport: string;
  league: string;
  home: string;
  away: string;
  marketType: string;
  selection: string;
  selectionType?: string;
  oddsDecimal: number;
  line?: number | null;
  hoursOut: number;
  isLive?: boolean;
  isActive?: boolean;
}): RawOddsRow {
  return {
    id: `mock-${mockRowId++}`,
    sportsbook: 'mockbook',
    event_id: params.eventId,
    sport: params.sport,
    league: params.league,
    home_team: params.home,
    away_team: params.away,
    market_type: params.marketType,
    selection: params.selection,
    selection_type: params.selectionType,
    odds_american: params.oddsDecimal >= 2 ? Math.round((params.oddsDecimal - 1) * 100) : Math.round(-100 / (params.oddsDecimal - 1)),
    odds_decimal: params.oddsDecimal,
    odds_probability: Math.round((1 / params.oddsDecimal) * 1000) / 1000,
    line: params.line ?? null,
    event_start_time: hoursFromNow(params.hoursOut),
    timestamp: new Date().toISOString(),
    is_live: params.isLive ?? false,
    is_active: params.isActive ?? true,
    is_main_line: true,
  };
}

/** One fixture's worth of rows: moneyline (1X2) + a total goals line. */
function fixture(
  eventId: string,
  sport: string,
  league: string,
  home: string,
  away: string,
  hoursOut: number,
  h2h: { home: number; draw: number; away: number },
  opts?: { isLive?: boolean; suspendedOutcome?: 'home' | 'draw' | 'away' }
): RawOddsRow[] {
  const isActive = (sel: 'home' | 'draw' | 'away') => opts?.suspendedOutcome !== sel;
  return [
    oddsRow({ eventId, sport, league, home, away, marketType: 'moneyline', selection: home, selectionType: 'home', oddsDecimal: h2h.home, hoursOut, isLive: opts?.isLive, isActive: isActive('home') }),
    oddsRow({ eventId, sport, league, home, away, marketType: 'moneyline', selection: 'Draw', selectionType: 'draw', oddsDecimal: h2h.draw, hoursOut, isLive: opts?.isLive, isActive: isActive('draw') }),
    oddsRow({ eventId, sport, league, home, away, marketType: 'moneyline', selection: away, selectionType: 'away', oddsDecimal: h2h.away, hoursOut, isLive: opts?.isLive, isActive: isActive('away') }),
    oddsRow({ eventId, sport, league, home, away, marketType: 'total', selection: 'Over', oddsDecimal: 1.85, line: 2.5, hoursOut, isLive: opts?.isLive }),
    oddsRow({ eventId, sport, league, home, away, marketType: 'total', selection: 'Under', oddsDecimal: 1.95, line: 2.5, hoursOut, isLive: opts?.isLive }),
  ];
}

export const MOCK_ODDS_ROWS: RawOddsRow[] = [
  ...fixture('mock-epl-1', 'soccer', 'england_-_premier_league', 'Arsenal', 'Chelsea', 25, { home: 1.75, draw: 3.8, away: 4.5 }),
  ...fixture('mock-epl-2', 'soccer', 'england_-_premier_league', 'Manchester City', 'Liverpool', 27, { home: 2.1, draw: 3.5, away: 3.2 }),
  ...fixture('mock-epl-3', 'soccer', 'england_-_premier_league', 'Tottenham Hotspur', 'Manchester United', 29, { home: 2.4, draw: 3.3, away: 3.0 }),
  ...fixture('mock-laliga-1', 'soccer', 'spain_-_la_liga', 'Real Madrid', 'Barcelona', 26, { home: 2.0, draw: 3.6, away: 3.4 }),
  ...fixture('mock-seriea-1', 'soccer', 'italy_-_serie_a', 'Juventus', 'AC Milan', 28, { home: 2.5, draw: 3.2, away: 2.9 }),
  // Two live matches — one with a market suspended (is_active: false), so
  // the "odds locked" UI treatment can be exercised in demo mode too.
  ...fixture('mock-live-1', 'soccer', 'england_-_premier_league', 'Newcastle United', 'Aston Villa', -0.5, { home: 2.05, draw: 3.5, away: 3.6 }, { isLive: true, suspendedOutcome: 'draw' }),
  ...fixture('mock-live-2', 'soccer', 'italy_-_serie_a', 'Roma', 'Napoli', -0.3, { home: 2.6, draw: 3.25, away: 2.75 }, { isLive: true }),
];
