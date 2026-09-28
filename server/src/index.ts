import express from 'express';
import cors from 'cors';
import { config, oddsApiConfig } from './config.js';
import { OddsApiService, OddsApiError } from './oddsApiService.js';
import { normalizeCompetitions, normalizeOddsRows, normalizeSports } from './normalize.js';
import { BETORA_SPORTS, type BetoraSport } from './sportMapping.js';
import { getTeamLogos } from './teamLogos.js';
import type { RawOddsRow } from './rawTypes.js';
import { virtualEngine } from './virtual/engine.js';
import { userStore } from './users/store.js';
import { walletRequestStore } from './wallet/store.js';
import type { CryptoMethod } from './wallet/types.js';
import { notificationStore } from './notifications/store.js';
import { transactionStore } from './transactions/store.js';
import { ensureSchema } from './db/pool.js';

const app = express();
const oddsApi = new OddsApiService(oddsApiConfig);

app.use(
  cors({
    origin: config.corsOrigins,
  })
);
app.use(express.json());

function isBetoraSport(value: string): value is BetoraSport {
  return (BETORA_SPORTS as readonly string[]).includes(value);
}

async function logosForRows(rows: RawOddsRow[]): Promise<Record<string, string | null>> {
  const teamNames = [...new Set(rows.flatMap((r) => [r.home_team, r.away_team]))];
  if (teamNames.length === 0) return {};
  return getTeamLogos(teamNames);
}

function handleError(res: express.Response, err: unknown) {
  if (err instanceof OddsApiError) {
    // eslint-disable-next-line no-console
    console.error('[ODDS API] upstream error:', err.message);
    res.status(502).json({ error: 'Unable to load matches', detail: err.message });
    return;
  }
  // eslint-disable-next-line no-console
  console.error('[ODDS API] unexpected error:', err);
  res.status(500).json({ error: 'Unable to load matches' });
}

// GET /api/sports — Betora-facing sport groups (football/basketball/tennis) and their competitions
app.get('/api/sports', async (_req, res) => {
  try {
    const raw = await oddsApi.getSports();
    res.json({
      sports: normalizeSports(raw),
      competitions: normalizeCompetitions(raw),
      config: { liveOddsRefreshIntervalMs: config.liveOddsRefreshIntervalMs },
    });
  } catch (err) {
    handleError(res, err);
  }
});

// GET /api/events?sport=football — upcoming events for a Betora sport
app.get('/api/events', async (req, res) => {
  const sport = String(req.query.sport ?? '');
  if (!isBetoraSport(sport)) {
    res.status(400).json({ error: 'Invalid or missing sport query parameter' });
    return;
  }
  // Real coverage can run into the thousands of events across hundreds of
  // leagues — sending all of it in one response is what was crashing
  // mobile clients (huge payload + huge in-memory render). Cap it here,
  // sorted soonest-first, with pagination metadata so the frontend can
  // offer "Show More" instead of trying to render everything at once.
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 60));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  try {
    const raw = await oddsApi.getUpcomingEvents(sport);
    const teamLogos = await logosForRows(raw);
    const allEvents = normalizeOddsRows(raw, { defaultBookmaker: config.defaultBookmaker }, teamLogos).sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    const events = allEvents.slice(offset, offset + limit);
    res.json({
      events,
      pagination: { total: allEvents.length, limit, offset, hasMore: offset + limit < allEvents.length },
    });
  } catch (err) {
    handleError(res, err);
  }
});

// GET /api/events/live — genuinely live events, optionally filtered by sport
app.get('/api/events/live', async (req, res) => {
  const sportParam = req.query.sport ? String(req.query.sport) : undefined;
  if (sportParam && !isBetoraSport(sportParam)) {
    res.status(400).json({ error: 'Invalid sport query parameter' });
    return;
  }
  // Same reasoning as /api/events — real live coverage can run into the
  // hundreds of simultaneous events; cap the response so no client ends up
  // holding (or rendering) all of them at once.
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 40));
  try {
    const raw = await oddsApi.getLiveEvents(sportParam as BetoraSport | undefined);
    const teamLogos = await logosForRows(raw);
    const events = normalizeOddsRows(raw, { defaultBookmaker: config.defaultBookmaker }, teamLogos).slice(0, limit);
    res.json({ events });
  } catch (err) {
    handleError(res, err);
  }
});

// GET /api/events/:id?sport=football — single event detail (all markets)
app.get('/api/events/:id', async (req, res) => {
  const sport = String(req.query.sport ?? '');
  if (!isBetoraSport(sport)) {
    res.status(400).json({ error: 'Invalid or missing sport query parameter' });
    return;
  }
  const eventId = req.params.id;
  if (!eventId || typeof eventId !== 'string' || eventId.length > 128) {
    res.status(400).json({ error: 'Invalid event id' });
    return;
  }
  try {
    const raw = await oddsApi.getEventRows(sport, eventId);
    if (raw.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    const teamLogos = await logosForRows(raw);
    const events = normalizeOddsRows(raw, { defaultBookmaker: config.defaultBookmaker }, teamLogos);
    const event = events[0];
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json({ event });
  } catch (err) {
    handleError(res, err);
  }
});

// ---- Virtual Football ----
// A fully simulated matchday cycle (not real sports data) — random EPL-named
// teams grouped into one matchday of fixtures, generated odds, and randomly
// determined results on a fixed timer.

// GET /api/virtual/current — the matchday currently in betting/in-play/settled phase
app.get('/api/virtual/current', (_req, res) => {
  try {
    res.json({ matchday: virtualEngine.getCurrentMatchday() });
  } catch {
    res.status(503).json({ error: 'Virtual engine not ready' });
  }
});

// GET /api/virtual/upcoming — preview of the next matchdays (fixtures/odds
// only, never results) so the UI can show what's coming up next.
app.get('/api/virtual/upcoming', (req, res) => {
  const count = Math.max(1, Math.min(5, Number(req.query.count) || 2));
  try {
    res.json({ matchdays: virtualEngine.getUpcomingPreview(count) });
  } catch {
    res.status(503).json({ error: 'Virtual engine not ready' });
  }
});

// POST /api/virtual/bets — place a bet ticket (one or more picks) on the current matchday
// body: { userId, userLabel, stake, picks: [{ fixtureId, marketKey, outcomeId }, ...] }
app.post('/api/virtual/bets', express.json(), async (req, res) => {
  const { userId, userLabel, stake, matchdayId, picks } = req.body ?? {};

  if (typeof userId !== 'string' || !userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }
  if (typeof stake !== 'number' || !Number.isFinite(stake) || stake <= 0) {
    res.status(400).json({ error: 'Invalid stake' });
    return;
  }
  if (typeof matchdayId !== 'string' || !matchdayId) {
    res.status(400).json({ error: 'Missing matchdayId' });
    return;
  }
  if (!Array.isArray(picks) || picks.length === 0) {
    res.status(400).json({ error: 'No selections provided' });
    return;
  }
  const validPicks = picks.every(
    (p) => p && typeof p.fixtureId === 'string' && typeof p.marketKey === 'string' && typeof p.outcomeId === 'string'
  );
  if (!validPicks) {
    res.status(400).json({ error: 'Invalid selection' });
    return;
  }

  try {
    const bet = await virtualEngine.placeBet({
      userId,
      userLabel: typeof userLabel === 'string' && userLabel ? userLabel : userId,
      stake,
      matchdayId,
      picks,
    });
    res.json({ bet });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to place bet' });
  }
});

// GET /api/virtual/bets?userId=... — a user's virtual bet history
app.get('/api/virtual/bets', async (req, res) => {
  const userId = String(req.query.userId ?? '');
  if (!userId) {
    res.status(400).json({ error: 'Missing userId query parameter' });
    return;
  }
  try {
    res.json({ bets: await virtualEngine.getBetsForUser(userId) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load bets' });
  }
});

// GET /api/virtual/bets/:id — a single bet ticket's full detail
app.get('/api/virtual/bets/:id', async (req, res) => {
  try {
    const bet = await virtualEngine.getBetById(req.params.id);
    if (!bet) {
      res.status(404).json({ error: 'Bet not found' });
      return;
    }
    res.json({ bet });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load bet' });
  }
});

// ---- Auth (backed by Postgres — see server/src/db) ----

app.post('/api/auth/signup', express.json(), async (req, res) => {
  const { fullName, email, password } = req.body ?? {};
  if (typeof fullName !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Invalid signup details' });
    return;
  }
  try {
    const user = await userStore.signup(fullName, email, password);
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to create account' });
  }
});

app.post('/api/auth/login', express.json(), async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Invalid login details' });
    return;
  }
  try {
    const user = await userStore.login(email, password);
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: err instanceof Error ? err.message : 'Unable to log in' });
  }
});

// GET /api/auth/me?userId=... — used to restore a session after a page
// reload: the frontend stores just the user id locally and re-validates it
// here on every app load, rather than trusting stale cached user data.
app.get('/api/auth/me', async (req, res) => {
  const userId = String(req.query.userId ?? '');
  if (!userId) {
    res.status(400).json({ error: 'Missing userId query parameter' });
    return;
  }
  try {
    const user = await userStore.getById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load session' });
  }
});

// ---- Admin (no auth wall for now, per current scope) ----

app.get('/api/admin/virtual/bets', async (_req, res) => {
  try {
    res.json({ bets: await virtualEngine.getAllBets() });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load bets' });
  }
});

app.get('/api/admin/virtual/users', async (_req, res) => {
  try {
    res.json({ users: await virtualEngine.getUserSummaries() });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load users' });
  }
});

// GET /api/admin/virtual/matchdays — current matchday plus the next 5,
// including predetermined results the public endpoint never reveals early.
app.get('/api/admin/virtual/matchdays', (_req, res) => {
  try {
    res.json({ matchdays: virtualEngine.getUpcomingMatchdaysForAdmin() });
  } catch {
    res.status(503).json({ error: 'Virtual engine not ready' });
  }
});

app.get('/api/admin/users', async (_req, res) => {
  try {
    res.json({ users: await userStore.getAll() });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load users' });
  }
});

// ---- Wallet ----
// Balance lives entirely on the backend, keyed by user id — the single
// source of truth for the whole app. Deposits and withdrawals are now
// approval-gated requests rather than instant actions: a deposit only
// credits once an admin approves it, and a withdrawal debits immediately
// (funds held pending review) but is only truly paid out on approval —
// rejecting it returns the held funds. Every balance-affecting event also
// creates a notification for the affected user.

app.get('/api/wallet/balance', async (req, res) => {
  const userId = String(req.query.userId ?? '');
  if (!userId) {
    res.status(400).json({ error: 'Missing userId query parameter' });
    return;
  }
  try {
    res.json({ balance: await userStore.getBalance(userId) });
  } catch (err) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'User not found' });
  }
});

// POST /api/wallet/deposit-request — creates a pending deposit request; no
// balance change happens until an admin approves it.
app.post('/api/wallet/deposit-request', express.json(), async (req, res) => {
  const { userId, userLabel, amount, method } = req.body ?? {};
  if (typeof userId !== 'string' || !userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: 'Invalid amount' });
    return;
  }
  if (typeof method !== 'string') {
    res.status(400).json({ error: 'Invalid method' });
    return;
  }
  try {
    const request = await walletRequestStore.createDeposit(
      userId,
      typeof userLabel === 'string' && userLabel ? userLabel : userId,
      method as CryptoMethod,
      amount
    );
    // eslint-disable-next-line no-console
    console.log(`[WALLET] Deposit request: ${userId} ${amount} (${method}) — pending admin review`);
    res.json({ request });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to submit deposit request' });
  }
});

// POST /api/wallet/withdrawal-request — debits balance immediately (held
// pending review) and creates a pending withdrawal request for admin review.
app.post('/api/wallet/withdrawal-request', express.json(), async (req, res) => {
  const { userId, userLabel, amount, method, address } = req.body ?? {};
  if (typeof userId !== 'string' || !userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: 'Invalid amount' });
    return;
  }
  if (typeof method !== 'string' || typeof address !== 'string' || !address) {
    res.status(400).json({ error: 'Invalid method or address' });
    return;
  }
  try {
    const request = await walletRequestStore.createWithdrawal(
      userId,
      typeof userLabel === 'string' && userLabel ? userLabel : userId,
      method as CryptoMethod,
      amount,
      address
    );
    // eslint-disable-next-line no-console
    console.log(`[WALLET] Withdrawal request: ${userId} ${amount} (${method}) — held pending admin review`);
    res.json({ request, balance: await userStore.getBalance(userId) });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to submit withdrawal request' });
  }
});

// GET /api/wallet/requests?userId=... — a user's own deposit/withdrawal request history
app.get('/api/wallet/requests', async (req, res) => {
  const userId = String(req.query.userId ?? '');
  if (!userId) {
    res.status(400).json({ error: 'Missing userId query parameter' });
    return;
  }
  try {
    res.json({ requests: await walletRequestStore.getForUser(userId) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load requests' });
  }
});

// POST /api/admin/wallet/adjust — admin can add or deduct any user's balance
// directly; always generates a notification framed as a deposit (credit) or
// withdrawal (debit), matching how a real balance change would read to the user.
app.post('/api/admin/wallet/adjust', express.json(), async (req, res) => {
  const { userId, amount, reason } = req.body ?? {};
  if (typeof userId !== 'string' || !userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount === 0) {
    res.status(400).json({ error: 'Invalid amount' });
    return;
  }
  try {
    const balance = await userStore.adjustBalance(userId, amount, true);
    const user = await userStore.getById(userId);
    const absAmount = `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (amount > 0) {
      await transactionStore.create({
        userId,
        type: 'deposit',
        description: reason ? `Admin Credit — ${reason}` : 'Admin Credit',
        amount,
      });
      await notificationStore.create(userId, 'Deposit Successful', `Deposit of ${absAmount} has been added to your balance.`);
    } else {
      await transactionStore.create({
        userId,
        type: 'withdrawal',
        description: reason ? `Admin Deduction — ${reason}` : 'Admin Deduction',
        amount,
      });
      await notificationStore.create(userId, 'Withdrawal Processed', `Withdrawal of ${absAmount} has been deducted from your balance.`);
    }
    // eslint-disable-next-line no-console
    console.log(`[ADMIN] Balance adjustment: ${userId} ${amount >= 0 ? '+' : ''}${amount}` + (reason ? ` (${reason})` : '') + ` -> balance ${balance}`);
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to adjust balance' });
  }
});

// ---- Admin: wallet request review ----

app.get('/api/admin/wallet/requests', async (_req, res) => {
  try {
    res.json({ requests: await walletRequestStore.getAll() });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load requests' });
  }
});

app.post('/api/admin/wallet/requests/:id/approve', async (req, res) => {
  try {
    const request = await walletRequestStore.approve(req.params.id);
    res.json({ request });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to approve request' });
  }
});

app.post('/api/admin/wallet/requests/:id/reject', async (req, res) => {
  try {
    const request = await walletRequestStore.reject(req.params.id);
    res.json({ request });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to reject request' });
  }
});

// ---- Notifications ----

app.get('/api/notifications', async (req, res) => {
  const userId = String(req.query.userId ?? '');
  if (!userId) {
    res.status(400).json({ error: 'Missing userId query parameter' });
    return;
  }
  try {
    res.json({ notifications: await notificationStore.getForUser(userId) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load notifications' });
  }
});

app.post('/api/notifications/:id/read', async (req, res) => {
  try {
    const notification = await notificationStore.markRead(req.params.id);
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to update notification' });
  }
});

// ---- Transaction history ----

app.get('/api/transactions', async (req, res) => {
  const userId = String(req.query.userId ?? '');
  if (!userId) {
    res.status(400).json({ error: 'Missing userId query parameter' });
    return;
  }
  try {
    res.json({ transactions: await transactionStore.getForUser(userId) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load transactions' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    mockMode: oddsApiConfig.useMockData || !oddsApiConfig.apiKey,
  });
});

async function main() {
  await ensureSchema();
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[ODDS API] Betora odds server listening on port ${config.port}`);
    virtualEngine.start().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[VIRTUAL] Failed to start engine:', err);
    });
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[SERVER] Failed to start:', err);
  process.exit(1);
});
