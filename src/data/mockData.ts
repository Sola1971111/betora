import type { Promotion, CryptoAddress, CryptoMethod, User } from '../types';


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

export function teamInitials(name: string | undefined | null): string {
  const safe = (name ?? '').trim();
  if (!safe) return '?';
  const words = safe.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function teamColor(name: string | undefined | null): string {
  const safe = name ?? '';
  let hash = 0;
  for (let i = 0; i < safe.length; i++) hash = (hash * 31 + safe.charCodeAt(i)) >>> 0;
  return crestPalette[hash % crestPalette.length];
}