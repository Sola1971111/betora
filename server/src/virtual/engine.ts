import { pickMatchdayFixtures, prefetchTeamLogos } from './teams.js';
import { generateFixtureMarkets } from './oddsGenerator.js';
import { determineResult } from './simulate.js';
import { virtualConfig } from '../config.js';
import { userStore } from '../users/store.js';
import { notificationStore } from '../notifications/store.js';
import type {
  PublicVirtualFixture,
  PublicVirtualMatchday,
  VirtualBet,
  VirtualBetSelection,
  VirtualFixture,
  VirtualMatchday,
} from './types.js';

const FIXTURES_PER_MATCHDAY = 9;
const LOOKAHEAD_COUNT = 5; // how many future matchdays stay pre-generated for admin preview

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('[VIRTUAL]', ...args);
}

/** Builds fixture content (teams, markets, predetermined result) with no
 * real timing yet — timing is stamped separately, only for whichever
 * matchday is actually current, to avoid any possibility of clock drift. */
function buildMatchdayContent(round: number): VirtualMatchday {
  const fixturePairs = pickMatchdayFixtures(FIXTURES_PER_MATCHDAY);
  const fixtures: VirtualFixture[] = fixturePairs.map(([homeTeam, awayTeam]) => {
    const { markets, homeEdge } = generateFixtureMarkets();
    const result = determineResult(homeEdge);
    return {
      id: `vf-${round}-${Math.random().toString(36).slice(2, 8)}`,
      homeTeam,
      awayTeam,
      markets,
      result,
    };
  });

  const placeholder = new Date().toISOString();
  return {
    id: `vm-${round}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    round,
    phase: 'betting',
    cycleStartedAt: placeholder,
    kickoffAt: placeholder,
    settleAt: placeholder,
    nextCycleAt: placeholder,
    fixtures,
  };
}

function stripResult(fixture: VirtualFixture): PublicVirtualFixture {
  const { result, ...rest } = fixture;
  return rest;
}

function toPublicMatchday(matchday: VirtualMatchday): PublicVirtualMatchday {
  // Results (including the goal timeline) are safe to reveal once betting
  // has closed — an in-play match can progressively show goals as they
  // "happen" without letting anyone bet with foreknowledge, since no more
  // bets are accepted at that point.
  const revealResults = matchday.phase !== 'betting';
  return {
    ...matchday,
    fixtures: matchday.fixtures.map((f) => (revealResults ? f : stripResult(f))),
  };
}

class VirtualEngine {
  private queue: VirtualMatchday[] = []; // index 0 = current/live matchday, rest = future lookahead content
  private round = 0;
  private bets: VirtualBet[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  async start() {
    if (this.timer || this.queue.length > 0) return; // already running

    await prefetchTeamLogos();

    for (let i = 0; i < LOOKAHEAD_COUNT + 1; i++) {
      this.round += 1;
      this.queue.push(buildMatchdayContent(this.round));
    }

    log(`Started — round ${this.queue[0].round} activating, ${LOOKAHEAD_COUNT} future matchdays queued`);
    this.activateCurrent();
  }

  /** Stamps queue[0] with real timing based on "now" and schedules its next
   * transition. Called once at startup and once per cycle — every matchday's
   * clock is always freshly anchored to the actual moment it goes live, so
   * timing can never drift or leave the engine stuck on a stale round. */
  private activateCurrent() {
    const current = this.queue[0];
    if (!current) return;

    const now = Date.now();
    current.phase = 'betting';
    current.cycleStartedAt = new Date(now).toISOString();
    current.kickoffAt = new Date(now + virtualConfig.bettingWindowSeconds * 1000).toISOString();
    current.settleAt = new Date(
      now + virtualConfig.bettingWindowSeconds * 1000 + virtualConfig.matchLengthSeconds * 1000
    ).toISOString();
    current.nextCycleAt = new Date(now + virtualConfig.cycleSeconds * 1000).toISOString();

    log(`Round ${current.round}: betting open (${current.fixtures.length} fixtures)`);
    this.schedule(() => this.lockBettingAndPlay(), virtualConfig.bettingWindowSeconds * 1000);
  }

  private lockBettingAndPlay() {
    const current = this.queue[0];
    if (!current) return;
    current.phase = 'in_play';
    log(`Round ${current.round}: betting locked, matchday in play`);
    this.schedule(() => this.settle(), virtualConfig.matchLengthSeconds * 1000);
  }

  private settle() {
    const current = this.queue[0];
    if (!current) return;
    current.phase = 'settled';

    log(
      `Round ${current.round}: settled — ` +
        current.fixtures
          .map((f) => `${f.homeTeam.shortName} ${f.result.homeScore}-${f.result.awayScore} ${f.awayTeam.shortName}`)
          .join(', ')
    );

    this.settleBetsForMatchday(current);

    const remainingMs = new Date(current.nextCycleAt).getTime() - Date.now();
    this.schedule(() => this.advanceQueue(), Math.max(0, remainingMs));
  }

  private advanceQueue() {
    this.queue.shift(); // drop the just-settled matchday
    this.round += 1;
    this.queue.push(buildMatchdayContent(this.round));
    this.activateCurrent();
  }

  /** Wraps every scheduled transition so a bug anywhere in the cycle logs
   * loudly instead of silently freezing the engine on the current phase
   * forever (the previous failure mode: one uncaught error inside a
   * setTimeout callback breaks the whole chain with no way to recover). */
  private schedule(fn: () => void, delayMs: number) {
    this.timer = setTimeout(() => {
      try {
        fn();
      } catch (err) {
        log('ERROR during scheduled transition — recovering by starting a fresh matchday:', err);
        try {
          this.queue = this.queue.slice(0, LOOKAHEAD_COUNT + 1);
          while (this.queue.length < LOOKAHEAD_COUNT + 1) {
            this.round += 1;
            this.queue.push(buildMatchdayContent(this.round));
          }
          this.activateCurrent();
        } catch (recoveryErr) {
          log('ERROR during recovery — engine may be stalled:', recoveryErr);
        }
      }
    }, delayMs);
  }

  private settleBetsForMatchday(matchday: VirtualMatchday) {
    const settledAt = new Date().toISOString();
    const fixtureResults = new Map(matchday.fixtures.map((f) => [f.id, f.result]));

    this.bets = this.bets.map((bet) => {
      if (bet.matchdayId !== matchday.id || bet.status !== 'pending') return bet;

      const allWon = bet.selections.every((sel) => {
        const result = fixtureResults.get(sel.fixtureId);
        if (!result) return false;
        const winners = (result.winningOutcomeIdsByMarket[sel.marketKey] ?? '').split(',');
        return winners.includes(sel.outcomeId);
      });

      if (allWon) {
        try {
          // Winnings credit the user's real backend balance exactly once,
          // here, at the moment of settlement — never client-driven, so
          // there is no possibility of a page revisit or a duplicate poll
          // crediting the same win twice.
          userStore.adjustBalance(bet.userId, bet.potentialWin, true);
          notificationStore.create(
            bet.userId,
            'Virtual Football — Bet Won',
            `Your Matchday #${bet.matchdayRound} bet won! $${bet.potentialWin.toFixed(2)} has been added to your balance.`
          );
        } catch (err) {
          log(`ERROR crediting winnings for bet ${bet.id}:`, err);
        }
      }

      return { ...bet, status: allWon ? 'won' : 'lost', settledAt };
    });
  }

  getCurrentMatchday(): PublicVirtualMatchday {
    const current = this.queue[0];
    if (!current) throw new Error('Virtual engine not started');
    return toPublicMatchday(current);
  }

  // ---- Admin: full lookahead including predetermined results ----

  getUpcomingMatchdaysForAdmin(count: number = LOOKAHEAD_COUNT + 1): VirtualMatchday[] {
    return this.queue.slice(0, count);
  }

  /**
   * Places a bet ticket covering one or more selections. A ticket with more
   * than one selection is a "multiple"/accumulator: it wins only if every
   * leg wins, and pays the product of all legs' odds. Every leg's odds are
   * re-validated against the current matchday's live prices — the client's
   * numbers are never trusted. Two selections on the same fixture are
   * rejected (mirrors the real bet slip's one-pick-per-match rule).
   */
  placeBet(params: {
    userId: string;
    userLabel: string;
    stake: number;
    picks: { fixtureId: string; marketKey: string; outcomeId: string }[];
  }): VirtualBet {
    const current = this.queue[0];
    if (!current) throw new Error('Virtual engine not started');
    if (current.phase !== 'betting') {
      throw new Error('Betting is closed for the current matchday');
    }
    if (params.picks.length === 0) throw new Error('No selections provided');

    const seenFixtures = new Set<string>();
    const selections: VirtualBetSelection[] = params.picks.map((pick) => {
      if (seenFixtures.has(pick.fixtureId)) {
        throw new Error('Only one selection per fixture is allowed in a single ticket');
      }
      seenFixtures.add(pick.fixtureId);

      const fixture = current.fixtures.find((f) => f.id === pick.fixtureId);
      if (!fixture) throw new Error('One of the selected fixtures is not part of the current matchday');
      const market = fixture.markets.find((m) => m.key === pick.marketKey);
      const outcome = market?.outcomes.find((o) => o.id === pick.outcomeId);
      if (!market || !outcome) throw new Error('One of the selected markets or outcomes is no longer available');

      return {
        fixtureId: fixture.id,
        homeTeam: fixture.homeTeam.name,
        awayTeam: fixture.awayTeam.name,
        marketKey: market.key,
        marketTitle: market.title,
        outcomeId: outcome.id,
        outcomeLabel: outcome.label,
        odds: outcome.odds, // always the server's current price, never client-supplied
      };
    });

    const combinedOdds = selections.reduce((acc, s) => acc * s.odds, 1);

    // Debit the stake from the user's real backend balance now — this
    // throws (and the whole bet is rejected) if they don't actually have
    // enough, rather than trusting a client-reported balance.
    userStore.adjustBalance(params.userId, -params.stake);

    const bet: VirtualBet = {
      id: `vb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      matchdayId: current.id,
      matchdayRound: current.round,
      userId: params.userId,
      userLabel: params.userLabel,
      type: selections.length > 1 ? 'multiple' : 'single',
      selections,
      combinedOdds: Math.round(combinedOdds * 100) / 100,
      stake: params.stake,
      potentialWin: Math.round(params.stake * combinedOdds * 100) / 100,
      placedAt: new Date().toISOString(),
      status: 'pending',
    };
    this.bets.push(bet);
    return bet;
  }

  getBetsForUser(userId: string): VirtualBet[] {
    return this.bets.filter((b) => b.userId === userId).sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1));
  }

  getAllBets(): VirtualBet[] {
    return [...this.bets].sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1));
  }

  getUserSummaries(): { userId: string; userLabel: string; betCount: number; totalStaked: number; totalWon: number }[] {
    const byUser = new Map<string, { userLabel: string; betCount: number; totalStaked: number; totalWon: number }>();
    for (const bet of this.bets) {
      const entry = byUser.get(bet.userId) ?? { userLabel: bet.userLabel, betCount: 0, totalStaked: 0, totalWon: 0 };
      entry.betCount += 1;
      entry.totalStaked += bet.stake;
      if (bet.status === 'won') entry.totalWon += bet.potentialWin;
      byUser.set(bet.userId, entry);
    }
    return Array.from(byUser.entries()).map(([userId, v]) => ({ userId, ...v }));
  }
}

export const virtualEngine = new VirtualEngine();
