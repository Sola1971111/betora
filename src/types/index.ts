export interface Sport {
  id: string;
  name: string;
}

export interface Competition {
  id: string;
  name: string;
  sportId: string;
  country?: string;
}

export interface Market {
  id: string;
  key?: string; // provider market key: "h2h", "totals", "spreads" — present for live data, absent for legacy mock data
  name: string; // "Match Result", "Double Chance", "Goals", "Both Teams To Score"
  category?: string; // "Main", "Goals", "Handicap", "Other" — used for match-detail tabs
  priority?: number; // display order within its category — lower shows first
  selections: MarketSelection[];
}

export interface MarketSelection {
  id: string;
  label: string; // "Home", "Draw", "Away", "Over 2.5"
  odds: number | null; // null means suspended/unavailable — never render a bettable button for null
  previousOdds?: number; // used to show a change indicator (↑/↓)
  point?: number | null; // handicap/total line, e.g. -1.5 or 2.5
}

export interface Match {
  id: string;
  sportId: string;
  competitionId: string;
  competitionName: string;
  competitionCountry?: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string | null; // crest/badge image URL from a logo source; null/absent if unavailable
  awayTeamLogo?: string | null;
  date: string; // ISO
  status: 'upcoming' | 'live' | 'finished';
  liveScore?: { home: number; away: number; minute: number | null };
  markets: Market[];
  totalMarketsCount?: number; // total available markets, for "+N Markets" affordance
  lastUpdate?: string | null; // ISO timestamp odds were last refreshed, from the data source
  bookmakerTitle?: string | null; // which bookmaker/source the odds came from
}

export interface BetSelection {
  id: string; // unique per selection instance
  matchId: string;
  matchLabel: string; // "Arsenal vs Liverpool"
  marketName: string;
  marketKey?: string; // provider market key, e.g. "h2h", "totals" — used to detect conflicting selections
  selectionLabel: string;
  odds: number;
  point?: number | null;
  sport?: string;
  league?: string;
  startTime?: string;
  oddsChanged?: boolean; // set true when a live refresh detects the price moved after selection
}

export type BetType = 'single' | 'multiple';

export interface PlacedBet {
  id: string; // "#BT482913"
  type: BetType;
  selections: BetSelection[];
  stake: number;
  combinedOdds: number;
  potentialWin: number;
  status: 'open' | 'won' | 'lost';
  placedAt: string;
}

export type CryptoMethod = 'bitcoin' | 'usdt' | 'ethereum' | 'solana';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'winnings' | 'bonus';
  method?: CryptoMethod;
  description: string;
  date: string;
  amount: number; // negative for outgoing
  status: 'completed' | 'pending' | 'failed';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  expiry: string;
  cta: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface CryptoAddress {
  id: string;
  method: CryptoMethod;
  network: string;
  address: string;
}

export interface SavedWithdrawalAddress {
  id: string;
  method: CryptoMethod;
  label: string; // e.g. "My Wallet" — defaults to a shortened address
  address: string;
  addedAt: string; // ISO
}

export interface User {
  fullName: string;
  email: string;
  verified: boolean;
  balance: number;
}
