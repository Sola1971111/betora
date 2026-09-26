import pg from 'pg';

const connectionString = process.env.DATABASE_URL ?? '';
const isLocalDb = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

if (!connectionString) {
  // eslint-disable-next-line no-console
  console.warn(
    '[DB] No DATABASE_URL configured — user accounts, wallet requests, notifications, and bet history will NOT persist across restarts. Set DATABASE_URL (e.g. a free Neon/Supabase Postgres) before deploying.'
  );
}

export const pool = new pg.Pool({
  connectionString: connectionString || undefined,
  // Hosted providers (Neon, Supabase, Render Postgres) require SSL; a local
  // dev database on localhost does not support it.
  ssl: connectionString && !isLocalDb ? { rejectUnauthorized: false } : undefined,
});

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    read BOOLEAN NOT NULL DEFAULT false
  );

  CREATE TABLE IF NOT EXISTS wallet_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_label TEXT NOT NULL,
    type TEXT NOT NULL,
    method TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
  );

  CREATE TABLE IF NOT EXISTS virtual_bets (
    id TEXT PRIMARY KEY,
    matchday_id TEXT NOT NULL,
    matchday_round INTEGER NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_label TEXT NOT NULL,
    type TEXT NOT NULL,
    selections JSONB NOT NULL,
    combined_odds NUMERIC(10,2) NOT NULL,
    stake NUMERIC(14,2) NOT NULL,
    potential_win NUMERIC(14,2) NOT NULL,
    placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending',
    settled_at TIMESTAMPTZ
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_wallet_requests_user ON wallet_requests(user_id);
  CREATE INDEX IF NOT EXISTS idx_virtual_bets_user ON virtual_bets(user_id);
  CREATE INDEX IF NOT EXISTS idx_virtual_bets_matchday ON virtual_bets(matchday_id);
`;

export async function ensureSchema(): Promise<void> {
  if (!connectionString) return; // nothing to connect to — routes will error clearly per-request instead
  await pool.query(SCHEMA_SQL);
  // eslint-disable-next-line no-console
  console.log('[DB] Connected and schema ready');
}