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

function parseNumericEnv(value: string | undefined, fallback: number): number {
  // Number('') is 0, not NaN — a blank (but present) env var would
  // silently produce 0 rather than falling back to the intended default,
  // which is especially dangerous for things like poll intervals (0ms =
  // fire continuously) or the port to bind to. Guard explicitly rather
  // than trusting Number() + ?? alone.
  const n = Number(value);
  return value && Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  port: parseNumericEnv(process.env.PORT, 8787),
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  liveOddsRefreshIntervalMs: parseNumericEnv(process.env.LIVE_ODDS_REFRESH_INTERVAL, 15000),
  defaultBookmaker: process.env.DEFAULT_BOOKMAKER ?? '',
} as const;

export const virtualConfig = {
  // How far apart consecutive matchdays' kickoffs are, in seconds — each
  // matchday is independently bettable from the moment it's created until
  // its own kickoff, so several matchdays are open for betting at once,
  // staggered by this interval.
  cycleSeconds: parseNumericEnv(process.env.VIRTUAL_CYCLE_SECONDS, 180),
  // Time to pick and place bets before a given matchday locks.
  bettingWindowSeconds: parseNumericEnv(process.env.VIRTUAL_BETTING_WINDOW_SECONDS, 150),
  // Total simulated match length — split evenly into two "halves" for the
  // live animation (e.g. 20 total = 10s first half + 10s second half).
  matchLengthSeconds: parseNumericEnv(process.env.VIRTUAL_MATCH_LENGTH_SECONDS, 20),
} as const;

export const oddsApiConfig: OddsApiConfig = {
  apiKey: process.env.ODDS_API_KEY ?? '',
  baseUrl: process.env.ODDS_API_BASE_URL ?? 'https://api.sharpapi.io/api/v1',
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
