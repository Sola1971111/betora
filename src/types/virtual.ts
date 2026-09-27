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
  minute: number;
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
  // Present once betting closes (in_play or settled) — hidden during betting.
  result?: VirtualResult;
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

export interface VirtualUpcomingPreview {
  round: number;
  projectedStartAt: string;
  fixtures: VirtualFixture[]; // never includes `result`
}

export interface VirtualBetSelection {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  marketKey: string;
  marketTitle: string;
  outcomeId: string;
  outcomeLabel: string;
  odds: number;
  won?: boolean;
  finalScore?: string;
  htScore?: string;
  actualOutcomeLabel?: string;
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

export interface VirtualUserSummary {
  userId: string;
  userLabel: string;
  betCount: number;
  totalStaked: number;
  totalWon: number;
}
