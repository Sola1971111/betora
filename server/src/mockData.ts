import type { RawEvent, RawSport } from './rawTypes.js';

export const MOCK_SPORTS: RawSport[] = [
  { key: 'soccer_epl', group: 'Soccer', title: 'EPL', description: 'English Premier League', active: true, has_outrights: false },
  { key: 'soccer_spain_la_liga', group: 'Soccer', title: 'La Liga', description: 'Spanish La Liga', active: true, has_outrights: false },
  { key: 'soccer_italy_serie_a', group: 'Soccer', title: 'Serie A', description: 'Italian Serie A', active: true, has_outrights: false },
  { key: 'soccer_germany_bundesliga', group: 'Soccer', title: 'Bundesliga', description: 'German Bundesliga', active: true, has_outrights: false },
  { key: 'soccer_france_ligue_one', group: 'Soccer', title: 'Ligue 1', description: 'French Ligue 1', active: true, has_outrights: false },
  { key: 'basketball_nba', group: 'Basketball', title: 'NBA', description: 'US Basketball', active: true, has_outrights: false },
  { key: 'tennis_atp_us_open', group: 'Tennis', title: 'ATP US Open', description: 'Tennis', active: true, has_outrights: false },
];

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 3600_000).toISOString();
}

/** Compact builder for a football fixture with Match Result + Totals markets. */
function footballFixture(
  id: string,
  sportKey: string,
  sportTitle: string,
  home: string,
  away: string,
  hoursOut: number,
  odds: { home: number; draw: number; away: number; over?: number; under?: number }
): RawEvent {
  return {
    id,
    sport_key: sportKey,
    sport_title: sportTitle,
    commence_time: hoursFromNow(hoursOut),
    home_team: home,
    away_team: away,
    bookmakers: [
      {
        key: 'mock_book',
        title: 'Mock Book',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            last_update: new Date().toISOString(),
            outcomes: [
              { name: home, price: odds.home },
              { name: 'Draw', price: odds.draw },
              { name: away, price: odds.away },
            ],
          },
          {
            key: 'totals',
            last_update: new Date().toISOString(),
            outcomes: [
              { name: 'Over', price: odds.over ?? 1.85, point: 2.5 },
              { name: 'Under', price: odds.under ?? 1.9, point: 2.5 },
            ],
          },
        ],
      },
    ],
  };
}

export const MOCK_EVENTS: RawEvent[] = [
  {
    id: 'mock-1',
    sport_key: 'soccer_epl',
    sport_title: 'EPL',
    commence_time: hoursFromNow(5),
    home_team: 'Arsenal',
    away_team: 'Chelsea',
    bookmakers: [
      {
        key: 'mock_book',
        title: 'Mock Book',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            last_update: new Date().toISOString(),
            outcomes: [
              { name: 'Arsenal', price: 1.85 },
              { name: 'Draw', price: 3.6 },
              { name: 'Chelsea', price: 4.2 },
            ],
          },
          {
            key: 'totals',
            last_update: new Date().toISOString(),
            outcomes: [
              { name: 'Over', price: 1.8, point: 2.5 },
              { name: 'Under', price: 1.95, point: 2.5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mock-2',
    sport_key: 'soccer_spain_la_liga',
    sport_title: 'La Liga',
    commence_time: new Date().toISOString(),
    home_team: 'Real Madrid',
    away_team: 'Barcelona',
    bookmakers: [
      {
        key: 'mock_book',
        title: 'Mock Book',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            last_update: new Date().toISOString(),
            outcomes: [
              { name: 'Real Madrid', price: 2.3 },
              { name: 'Draw', price: 3.1 },
              { name: 'Barcelona', price: 2.9 },
            ],
          },
        ],
      },
    ],
    completed: false,
    scores: [
      { name: 'Real Madrid', score: '1' },
      { name: 'Barcelona', score: '1' },
    ],
    last_update: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    sport_key: 'basketball_nba',
    sport_title: 'NBA',
    commence_time: hoursFromNow(24),
    home_team: 'Los Angeles Lakers',
    away_team: 'Boston Celtics',
    bookmakers: [
      {
        key: 'mock_book',
        title: 'Mock Book',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            last_update: new Date().toISOString(),
            outcomes: [
              { name: 'Los Angeles Lakers', price: 1.65 },
              { name: 'Boston Celtics', price: 2.25 },
            ],
          },
          {
            key: 'spreads',
            last_update: new Date().toISOString(),
            outcomes: [
              { name: 'Los Angeles Lakers', price: 1.9, point: -4.5 },
              { name: 'Boston Celtics', price: 1.9, point: 4.5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mock-4',
    sport_key: 'tennis_atp_us_open',
    sport_title: 'ATP US Open',
    commence_time: hoursFromNow(8),
    home_team: 'Carlos Alcaraz',
    away_team: 'Novak Djokovic',
    bookmakers: [
      {
        key: 'mock_book',
        title: 'Mock Book',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            last_update: new Date().toISOString(),
            outcomes: [
              { name: 'Carlos Alcaraz', price: 1.75 },
              { name: 'Novak Djokovic', price: 2.05 },
            ],
          },
        ],
      },
    ],
  },
  // Tomorrow's demo fixtures — EPL matches ~26-32 hours out, so they show
  // under "Upcoming" and "Tomorrow" while the real API key situation is
  // sorted out.
  {
    id: 'mock-5',
    sport_key: 'soccer_epl',
    sport_title: 'EPL',
    commence_time: hoursFromNow(26),
    home_team: 'Manchester City',
    away_team: 'Liverpool',
    bookmakers: [
      {
        key: 'mock_book',
        title: 'Mock Book',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            last_update: new Date().toISOString(),
            outcomes: [
              { name: 'Manchester City', price: 1.95 },
              { name: 'Draw', price: 3.7 },
              { name: 'Liverpool', price: 3.9 },
            ],
          },
          {
            key: 'totals',
            last_update: new Date().toISOString(),
            outcomes: [
              { name: 'Over', price: 1.7, point: 2.5 },
              { name: 'Under', price: 2.1, point: 2.5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mock-6',
    sport_key: 'soccer_epl',
    sport_title: 'EPL',
    commence_time: hoursFromNow(28),
    home_team: 'Tottenham Hotspur',
    away_team: 'Manchester United',
    bookmakers: [
      {
        key: 'mock_book',
        title: 'Mock Book',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            last_update: new Date().toISOString(),
            outcomes: [
              { name: 'Tottenham Hotspur', price: 2.5 },
              { name: 'Draw', price: 3.4 },
              { name: 'Manchester United', price: 2.8 },
            ],
          },
          {
            key: 'totals',
            last_update: new Date().toISOString(),
            outcomes: [
              { name: 'Over', price: 1.75, point: 2.5 },
              { name: 'Under', price: 2.0, point: 2.5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mock-7',
    sport_key: 'soccer_epl',
    sport_title: 'EPL',
    commence_time: hoursFromNow(30),
    home_team: 'Newcastle United',
    away_team: 'Aston Villa',
    bookmakers: [
      {
        key: 'mock_book',
        title: 'Mock Book',
        last_update: new Date().toISOString(),
        markets: [
          {
            key: 'h2h',
            last_update: new Date().toISOString(),
            outcomes: [
              { name: 'Newcastle United', price: 2.05 },
              { name: 'Draw', price: 3.5 },
              { name: 'Aston Villa', price: 3.6 },
            ],
          },
        ],
      },
    ],
  },
  // 20 more fixtures for tomorrow across the top 5 European leagues, so
  // Home/Sports has a genuinely full "Tomorrow" matchday even in demo mode.
  footballFixture('mock-8', 'soccer_epl', 'EPL', 'Chelsea', 'Brighton & Hove Albion', 25, { home: 1.75, draw: 3.8, away: 4.5 }),
  footballFixture('mock-9', 'soccer_epl', 'EPL', 'Everton', 'West Ham United', 27, { home: 2.4, draw: 3.3, away: 3.0 }),
  footballFixture('mock-10', 'soccer_epl', 'EPL', 'Brentford', 'Wolverhampton Wanderers', 29, { home: 2.1, draw: 3.4, away: 3.5 }),
  footballFixture('mock-11', 'soccer_epl', 'EPL', 'Fulham', 'AFC Bournemouth', 31, { home: 2.3, draw: 3.3, away: 3.2 }),
  footballFixture('mock-12', 'soccer_epl', 'EPL', 'Nottingham Forest', 'Crystal Palace', 33, { home: 2.6, draw: 3.2, away: 2.9 }),
  footballFixture('mock-13', 'soccer_spain_la_liga', 'La Liga', 'Atletico Madrid', 'Sevilla', 24, { home: 1.7, draw: 3.7, away: 4.6 }),
  footballFixture('mock-14', 'soccer_spain_la_liga', 'La Liga', 'Real Sociedad', 'Villarreal', 26, { home: 2.5, draw: 3.3, away: 2.85 }),
  footballFixture('mock-15', 'soccer_spain_la_liga', 'La Liga', 'Real Betis', 'Athletic Bilbao', 28, { home: 2.35, draw: 3.25, away: 3.0 }),
  footballFixture('mock-16', 'soccer_spain_la_liga', 'La Liga', 'Valencia', 'Celta Vigo', 30, { home: 2.45, draw: 3.2, away: 2.95 }),
  footballFixture('mock-17', 'soccer_italy_serie_a', 'Serie A', 'Juventus', 'AC Milan', 25, { home: 2.5, draw: 3.2, away: 2.9 }),
  footballFixture('mock-18', 'soccer_italy_serie_a', 'Serie A', 'Inter Milan', 'Napoli', 27, { home: 2.1, draw: 3.4, away: 3.4 }),
  footballFixture('mock-19', 'soccer_italy_serie_a', 'Serie A', 'AS Roma', 'Atalanta', 29, { home: 2.6, draw: 3.25, away: 2.75 }),
  footballFixture('mock-20', 'soccer_italy_serie_a', 'Serie A', 'Fiorentina', 'Lazio', 31, { home: 2.7, draw: 3.15, away: 2.7 }),
  footballFixture('mock-21', 'soccer_germany_bundesliga', 'Bundesliga', 'Bayern Munich', 'Borussia Dortmund', 24, { home: 1.55, draw: 4.2, away: 5.5 }),
  footballFixture('mock-22', 'soccer_germany_bundesliga', 'Bundesliga', 'RB Leipzig', 'Bayer Leverkusen', 26, { home: 2.7, draw: 3.5, away: 2.5 }),
  footballFixture('mock-23', 'soccer_germany_bundesliga', 'Bundesliga', 'Eintracht Frankfurt', 'VfB Stuttgart', 28, { home: 2.4, draw: 3.4, away: 2.9 }),
  footballFixture('mock-24', 'soccer_germany_bundesliga', 'Bundesliga', 'Borussia Monchengladbach', 'Union Berlin', 30, { home: 2.55, draw: 3.3, away: 2.75 }),
  footballFixture('mock-25', 'soccer_france_ligue_one', 'Ligue 1', 'Paris Saint-Germain', 'Marseille', 25, { home: 1.5, draw: 4.4, away: 6.0 }),
  footballFixture('mock-26', 'soccer_france_ligue_one', 'Ligue 1', 'AS Monaco', 'Lyon', 27, { home: 2.2, draw: 3.4, away: 3.2 }),
  footballFixture('mock-27', 'soccer_france_ligue_one', 'Ligue 1', 'Lille', 'Rennes', 29, { home: 2.15, draw: 3.35, away: 3.3 }),
];

export const MOCK_LIVE_EVENTS: RawEvent[] = MOCK_EVENTS.filter((e) => e.id === 'mock-2');
