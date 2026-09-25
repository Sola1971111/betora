import type {
  PlacedBet,
  Transaction,
  AppNotification,
  Promotion,
  CryptoAddress,
  CryptoMethod,
  User,
} from '../types';

export const placedBets: PlacedBet[] = [
  {
    id: '#BT482913',
    type: 'multiple',
    selections: [
      { id: 's1', matchId: 'm1', matchLabel: 'Man United vs Chelsea', marketName: 'Match Result', selectionLabel: 'Home', odds: 2.1 },
      { id: 's2', matchId: 'm2', matchLabel: 'Arsenal vs Liverpool', marketName: 'Match Result', selectionLabel: 'Home', odds: 1.85 },
    ],
    stake: 20,
    combinedOdds: 3.885,
    potentialWin: 77.7,
    status: 'open',
    placedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '#BT481022',
    type: 'single',
    selections: [
      { id: 's3', matchId: 'm4', matchLabel: 'Bayern Munich vs PSG', marketName: 'Both Teams To Score', selectionLabel: 'Yes', odds: 1.6 },
    ],
    stake: 40,
    combinedOdds: 1.6,
    potentialWin: 64,
    status: 'won',
    placedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '#BT479881',
    type: 'single',
    selections: [
      { id: 's4', matchId: 'm6', matchLabel: 'Dortmund vs Leipzig', marketName: 'Match Result', selectionLabel: 'Away', odds: 3.5 },
    ],
    stake: 10,
    combinedOdds: 3.5,
    potentialWin: 35,
    status: 'lost',
    placedAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

export const transactions: Transaction[] = [
  { id: 't1', type: 'deposit', method: 'bitcoin', description: 'Bitcoin Deposit', date: new Date(Date.now() - 3600000).toISOString(), amount: 100, status: 'completed' },
  { id: 't2', type: 'bet', description: 'Bet Placed #BT482913', date: new Date(Date.now() - 3500000).toISOString(), amount: -20, status: 'completed' },
  { id: 't3', type: 'winnings', description: 'Bet Winnings #BT481022', date: new Date(Date.now() - 172000000).toISOString(), amount: 64, status: 'completed' },
  { id: 't4', type: 'withdrawal', description: 'Withdrawal Request', date: new Date(Date.now() - 200000000).toISOString(), amount: -50, status: 'pending' },
  { id: 't5', type: 'deposit', method: 'usdt', description: 'USDT Deposit', date: new Date(Date.now() - 300000000).toISOString(), amount: 200, status: 'completed' },
  { id: 't6', type: 'bonus', description: 'Welcome Bonus', date: new Date(Date.now() - 350000000).toISOString(), amount: 20, status: 'completed' },
];

export const notifications: AppNotification[] = [
  { id: 'n1', title: 'Deposit Successful', message: 'Your $100.00 Bitcoin deposit was successful.', date: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: 'n2', title: 'Bet Settled', message: 'Your bet #BT481022 has been settled.', date: new Date(Date.now() - 172000000).toISOString(), read: false },
  { id: 'n3', title: 'Withdrawal Processing', message: 'Your withdrawal request is being processed.', date: new Date(Date.now() - 200000000).toISOString(), read: true },
  { id: 'n4', title: 'Welcome to Betora', message: 'Welcome to Betora. Bet smarter, play responsibly.', date: new Date(Date.now() - 400000000).toISOString(), read: true },
];

export const promotions: Promotion[] = [
  { id: 'p1', title: 'Welcome Bonus', description: 'Get up to $250 on your first deposit.', expiry: 'No expiry', cta: 'Claim Now' },
  { id: 'p2', title: 'Weekend Bonus', description: 'Enjoy special promotions every weekend.', expiry: 'Ends Sunday', cta: 'View Offer' },
];

export const cryptoAddresses: Record<CryptoMethod, CryptoAddress> = {
  bitcoin: {
    id: 'addr-btc',
    method: 'bitcoin',
    network: 'Bitcoin Network',
    address: 'bc1qdn6vz80lnvkpm2sspfpm29sh632swhas8ct6wr',
  },
  usdt: {
    id: 'addr-usdt',
    method: 'usdt',
    network: 'TRC-20 (Tron)',
    address: 'TXdJnsuX61TsEJXNrANZgepwQr6M1cg4qe',
  },
  ethereum: {
    id: 'addr-eth',
    method: 'ethereum',
    network: 'Ethereum (ERC-20)',
    address: '0xDF7B5ea7c46c9c1241c8f23Ab9E0Fb762507Fa4e',
  },
  solana: {
    id: 'addr-sol',
    method: 'solana',
    network: 'Solana Network',
    address: '8XQJaxDHz4ZLKzhfQSaFwkdbQ77paPfZrP4K1xPPiGZb',
  },
};

// Simple mock USD conversion rates for display purposes only
export const BTC_USD_RATE = 62000;
export const ETH_USD_RATE = 2450;
export const SOL_USD_RATE = 140;

export const currentUser: User = {
  fullName: 'Oyedeji Joshua Olusola',
  email: 'coozie@example.com',
  verified: true,
  balance: 1250,
};

export function formatUsd(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Deterministic 2-letter initials + color for a lightweight "crest" badge (no real club logos)
const crestPalette = ['#16A34A', '#0F172A', '#F59E0B', '#2563EB', '#7C3AED', '#DC2626', '#0891B2'];

export function teamInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function teamColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return crestPalette[hash % crestPalette.length];
}
