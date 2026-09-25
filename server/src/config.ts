import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env.local first (developer overrides, gitignored), then .env as a fallback base.
loadEnv({ path: path.resolve(__dirname, '../.env.local') });
loadEnv({ path: path.resolve(__dirname, '../.env') });

import type { OddsApiConfig } from './oddsApiService.js';

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

export const config = {
  port: Number(process.env.PORT ?? 8787),
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  liveOddsRefreshIntervalMs: Number(process.env.LIVE_ODDS_REFRESH_INTERVAL ?? 15000),
  defaultBookmaker: process.env.DEFAULT_BOOKMAKER ?? '',
} as const;

export const virtualConfig = {
  // Total length of one virtual match cycle, in seconds: betting window +
  // simulated match + results-shown pause before the next fixture starts.
  cycleSeconds: Number(process.env.VIRTUAL_CYCLE_SECONDS ?? 250),
  // 3 minutes to pick and place bets before the matchday locks.
  bettingWindowSeconds: Number(process.env.VIRTUAL_BETTING_WINDOW_SECONDS ?? 180),
  matchLengthSeconds: Number(process.env.VIRTUAL_MATCH_LENGTH_SECONDS ?? 60),
} as const;

export const oddsApiConfig: OddsApiConfig = {
  apiKey: process.env.ODDS_API_KEY ?? '',
  baseUrl: process.env.ODDS_API_BASE_URL ?? 'https://api.the-odds-api.com',
  region: process.env.DEFAULT_ODDS_REGION ?? 'eu',
  oddsFormat: process.env.ODDS_FORMAT ?? 'decimal',
  useMockData: bool(process.env.USE_MOCK_DATA, false),
};

if (oddsApiConfig.useMockData || !oddsApiConfig.apiKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[ODDS API] Running in MOCK DATA mode' +
      (oddsApiConfig.apiKey ? ' (USE_MOCK_DATA=true)' : ' (no ODDS_API_KEY configured)') +
      ' — do not use this configuration in production.'
  );
}
