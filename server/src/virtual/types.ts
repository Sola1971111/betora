export type VirtualPhase = 'betting' | 'in_play' | 'settled';

export interface VirtualOutcome {
  id: string;
  label: string;
  odds: number;
}

export type VirtualMarketKey = 'h2h' | 'totals' | 'double_chance' | 'btts' | 'correct_score';

export interface VirtualMarket {
  key: VirtualMarketKey;
  title: string;
  outcomes: VirtualOutcome[];
}

export interface VirtualTeam {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
}

export interface VirtualGoalEvent {
  minute: number; // 1-90, virtual match minute
  team: 'home' | 'away';
  homeScoreAfter: number;
  awayScoreAfter: number;
}

export interface VirtualResult {
  homeScore: number;
  awayScore: number;
  winningOutcomeIdsByMarket: Record<string, string>;
  goalEvents: VirtualGoalEvent[];
}

export interface VirtualFixture {
  id: string;
  homeTeam: VirtualTeam;
  awayTeam: VirtualTeam;
  markets: VirtualMarket[];
  // Predetermined at matchday creation time (see engine) so admin can preview
  // upcoming results — stripped from user-facing responses until settled.
  result: VirtualResult;
}

export interface VirtualMatchday {
  id: string;
  round: number;
  phase: VirtualPhase;
  cycleStartedAt: string;
  kickoffAt: string;
  settleAt: string;
  nextCycleAt: string;
  fixtures: VirtualFixture[];
}

// User-facing matchday — same shape, but each fixture's `result` (including
// the goal timeline) is only present once betting has closed: revealing it
// progressively during in_play is safe since no more bets can be placed,
// and it lets the frontend animate goals as the simulated match "happens".
export type PublicVirtualFixture = Omit<VirtualFixture, 'result'> & { result?: VirtualResult };
export type PublicVirtualMatchday = Omit<VirtualMatchday, 'fixtures'> & { fixtures: PublicVirtualFixture[] };

export interface VirtualBetSelection {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  marketKey: string;
  marketTitle: string;
  outcomeId: string;
  outcomeLabel: string;
  odds: number;
  // Populated once the matchday settles — undefined while still pending.
  won?: boolean;
  finalScore?: string; // e.g. "2-1"
}

export interface VirtualBet {
  id: string;
  matchdayId: string;
  matchdayRound: number;
  userId: string;
  userLabel: string;
  type: 'single' | 'multiple';
  selections: VirtualBetSelection[];
  combinedOdds: number;
  stake: number;
  potentialWin: number;
  placedAt: string;
  status: 'pending' | 'won' | 'lost';
  settledAt?: string;
}
