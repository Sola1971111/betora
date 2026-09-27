import { pickMatchdayFixtures, prefetchTeamLogos } from './teams.js';
import { generateFixtureMarkets } from './oddsGenerator.js';
import { determineResult } from './simulate.js';
import { virtualConfig } from '../config.js';
import { userStore } from '../users/store.js';
import { notificationStore } from '../notifications/store.js';
import { virtualBetStore } from './betStore.js';
import { transactionStore } from '../transactions/store.js';
import type {
  PublicVirtualFixture,
  PublicVirtualMatchday,
  VirtualBet,
  VirtualBetSelection,
  VirtualFixture,
  VirtualMatchday,
} from './types.js';

const FIXTURES_PER_MATCHDAY = 9;
const LOOKAHEAD_COUNT = 5; // how many matchdays stay open/queued at once
const SETTLED_DISPLAY_SECONDS = 10; // how long a just-settled matchday stays visible before being retired

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('[VIRTUAL]', ...args);
}

function stripResult(fixture: VirtualFixture): PublicVirtualFixture {
  const { result, ...rest } = fixture;
  return rest;
}

/** What actually happened for a given market, in the same label style as
 * the pick itself — used so a lost leg shows the real outcome rather than
 * just echoing back the (wrong) pick. */
function actualOutcomeLabelFor(fixture: VirtualFixture, marketKey: string): string | undefined {
  const result = fixture.result;
  if (marketKey === 'double_chance') {
    if (result.homeScore > result.awayScore) return 'Home Win';
    if (result.awayScore > result.homeScore) return 'Away Win';
    return 'Draw';
  }
  const market = fixture.markets.find((m) => m.key === marketKey);
  const winnerIds = (result.winningOutcomeIdsByMarket[marketKey] ?? '').split(',');
  const winnerId = winnerIds[0];
  return market?.outcomes.find((o) => o.id === winnerId)?.label ?? winnerId;
}

/** Score at the 45-minute mark, derived from the goal timeline. */
function halfTimeScoreFor(fixture: VirtualFixture): string {
  const events = fixture.result.goalEvents;
  const atHalf = [...events].filter((e) => e.minute <= 45).sort((a, b) => a.minute - b.minute);
  const home = atHalf.filter((e) => e.team === 'home').length;
  const away = atHalf.filter((e) => e.team === 'away').length;
  return `${home}-${away}`;
}

function toPublicMatchday(matchday: VirtualMatchday): PublicVirtualMatchday {
  const revealResults = matchday.phase !== 'betting';
  return {
    ...matchday,
    fixtures: matchday.fixtures.map((f) => (revealResults ? f : stripResult(f))),
  };
}

/** Builds one matchday's fixtures/markets/predetermined-results and stamps
 * it with real timing based on the given kickoff-anchored start time. Every
 * matchday gets real timestamps immediately (unlike the old single-active
 * design) since several matchdays are now concurrently open for betting,
 * each counting down to its own kickoff independently. */
function buildMatchday(round: number, startAt: number): VirtualMatchday {
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

  const kickoffAt = startAt + virtualConfig.bettingWindowSeconds * 1000;
  const settleAt = kickoffAt + virtualConfig.matchLengthSeconds * 1000;

  return {
    id: `vm-${round}-${startAt}-${Math.random().toString(36).slice(2, 6)}`,
    round,
    phase: 'betting',
    cycleStartedAt: new Date(startAt).toISOString(),
    kickoffAt: new Date(kickoffAt).toISOString(),
    settleAt: new Date(settleAt).toISOString(),
    nextCycleAt: new Date(startAt + virtualConfig.cycleSeconds * 1000).toISOString(), // legacy field, kept for shape compatibility
    fixtures,
  };
}

class VirtualEngine {
  // Every currently-open-or-recently-settled matchday, ordered by kickoff —
  // index 0 is the soonest (the one featured on the main board); the rest
  // are still open for betting with a later kickoff, staggered by
  // `cycleSeconds`. Multiple matchdays are simultaneously bettable.
  private matchdays: VirtualMatchday[] = [];
  private round = 0;
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  async start() {
    if (this.matchdays.length > 0) return; // already running

    await prefetchTeamLogos();

    const now = Date.now();
    for (let i = 0; i < LOOKAHEAD_COUNT + 1; i++) {
      this.round += 1;
      const matchday = buildMatchday(this.round, now + i * virtualConfig.cycleSeconds * 1000);
      this.matchdays.push(matchday);
      this.scheduleKickoff(matchday);
    }

    log(`Started — ${this.matchdays.length} matchdays open, kickoffs staggered ${virtualConfig.cycleSeconds}s apart`);
  }

  private scheduleKickoff(matchday: VirtualMatchday) {
    const delay = Math.max(0, new Date(matchday.kickoffAt).getTime() - Date.now());
    this.schedule(matchday.id, () => this.lockAndPlay(matchday.id), delay);
  }

  private lockAndPlay(id: string) {
    const matchday = this.matchdays.find((m) => m.id === id);
    if (!matchday) return;
    matchday.phase = 'in_play';
    log(`Round ${matchday.round}: betting locked, in play`);
    const delay = Math.max(0, new Date(matchday.settleAt).getTime() - Date.now());
    this.schedule(id, () => this.settle(id), delay);
  }

  private async settle(id: string) {
    const matchday = this.matchdays.find((m) => m.id === id);
    if (!matchday) return;
    matchday.phase = 'settled';

    log(
      `Round ${matchday.round}: settled — ` +
        matchday.fixtures
          .map((f) => `${f.homeTeam.shortName} ${f.result.homeScore}-${f.result.awayScore} ${f.awayTeam.shortName}`)
          .join(', ')
    );

    await this.settleBetsForMatchday(matchday);
    this.schedule(id, () => this.retireAndReplace(id), SETTLED_DISPLAY_SECONDS * 1000);
  }

  private retireAndReplace(id: string) {
    const idx = this.matchdays.findIndex((m) => m.id === id);
    if (idx === -1) return;
    this.matchdays.splice(idx, 1);
    this.timers.delete(id);

    this.round += 1;
    const last = this.matchdays[this.matchdays.length - 1];
    const nextStartAt = last
      ? new Date(last.cycleStartedAt).getTime() + virtualConfig.cycleSeconds * 1000
      : Date.now();
    const fresh = buildMatchday(this.round, nextStartAt);
    this.matchdays.push(fresh);
    this.scheduleKickoff(fresh);
    log(`Round ${fresh.round}: added to the open queue, kicks off at ${fresh.kickoffAt}`);
  }

  /** Wraps every scheduled transition so a bug anywhere in the cycle logs
   * loudly instead of silently freezing that matchday forever. */
  private schedule(id: string, fn: () => void | Promise<void>, delayMs: number) {
    const timer = setTimeout(() => {
      Promise.resolve(fn()).catch((err) => {
        log(`ERROR during scheduled transition for matchday ${id} — retiring it and replacing:`, err);
        try {
          this.retireAndReplace(id);
        } catch (recoveryErr) {
          log('ERROR during recovery — engine may be stalled:', recoveryErr);
        }
      });
    }, delayMs);
    this.timers.set(id, timer);
  }

  private async settleBetsForMatchday(matchday: VirtualMatchday) {
    const fixturesById = new Map(matchday.fixtures.map((f) => [f.id, f]));
    const pendingBets = await virtualBetStore.getPendingForMatchday(matchday.id);

    for (const bet of pendingBets) {
      const updatedSelections = bet.selections.map((sel) => {
        const fixture = fixturesById.get(sel.fixtureId);
        if (!fixture) return { ...sel, won: false };
        const result = fixture.result;
        const winners = (result.winningOutcomeIdsByMarket[sel.marketKey] ?? '').split(',');
        return {
          ...sel,
          won: winners.includes(sel.outcomeId),
          finalScore: `${result.homeScore}-${result.awayScore}`,
          htScore: halfTimeScoreFor(fixture),
          actualOutcomeLabel: actualOutcomeLabelFor(fixture, sel.marketKey),
        };
      });
      const allWon = updatedSelections.every((sel) => sel.won);

      await virtualBetStore.settle(bet.id, allWon ? 'won' : 'lost', updatedSelections);

      if (allWon) {
        try {
          await userStore.adjustBalance(bet.userId, bet.potentialWin, true);
          await transactionStore.create({
            userId: bet.userId,
            type: 'winnings',
            description: `Virtual Football Winnings — Matchday #${bet.matchdayRound}`,
            amount: bet.potentialWin,
          });
          await notificationStore.create(
            bet.userId,
            'Virtual Football — Bet Won',
            `Your Matchday #${bet.matchdayRound} bet won! $${bet.potentialWin.toFixed(2)} has been added to your balance.`
          );
        } catch (err) {
          log(`ERROR crediting winnings for bet ${bet.id}:`, err);
        }
      }
    }
  }

  /** The soonest-kickoff matchday — featured on the main board. */
  getCurrentMatchday(): PublicVirtualMatchday {
    const current = this.matchdays[0];
    if (!current) throw new Error('Virtual engine not started');
    return toPublicMatchday(current);
  }

  /**
   * Every OTHER matchday currently open for betting (excluding the featured
   * one) — full fixtures and live odds, never results, since these are
   * genuinely bettable right now, just not yet kicked off.
   */
  getUpcomingPreview(count = 2): { round: number; matchdayId: string; projectedStartAt: string; fixtures: PublicVirtualFixture[] }[] {
    return this.matchdays
      .slice(1, 1 + count)
      .filter((m) => m.phase === 'betting')
      .map((matchday) => ({
        round: matchday.round,
        matchdayId: matchday.id,
        projectedStartAt: matchday.kickoffAt,
        fixtures: matchday.fixtures.map(stripResult),
      }));
  }

  // ---- Admin: full lookahead including predetermined results ----

  getUpcomingMatchdaysForAdmin(): VirtualMatchday[] {
    return [...this.matchdays];
  }

  /**
   * Places a bet ticket covering one or more selections, all from a single
   * specified matchday (which may be the featured one or any other
   * currently-open one — several are bettable at once). A ticket with more
   * than one selection is a "multiple"/accumulator: it wins only if every
   * leg wins, and pays the product of all legs' odds. Every leg's odds are
   * re-validated against that matchday's live prices — the client's numbers
   * are never trusted. Two selections on the same fixture are rejected.
   */
  async placeBet(params: {
    userId: string;
    userLabel: string;
    stake: number;
    matchdayId: string;
    picks: { fixtureId: string; marketKey: string; outcomeId: string }[];
  }): Promise<VirtualBet> {
    const matchday = this.matchdays.find((m) => m.id === params.matchdayId);
    if (!matchday) throw new Error('That matchday is no longer available');
    if (matchday.phase !== 'betting') {
      throw new Error('Betting is closed for that matchday');
    }
    if (params.picks.length === 0) throw new Error('No selections provided');

    const seenFixtures = new Set<string>();
    const selections: VirtualBetSelection[] = params.picks.map((pick) => {
      if (seenFixtures.has(pick.fixtureId)) {
        throw new Error('Only one selection per fixture is allowed in a single ticket');
      }
      seenFixtures.add(pick.fixtureId);

      const fixture = matchday.fixtures.find((f) => f.id === pick.fixtureId);
      if (!fixture) throw new Error('One of the selected fixtures is not part of that matchday');
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
        odds: outcome.odds,
      };
    });

    const combinedOdds = selections.reduce((acc, s) => acc * s.odds, 1);

    await userStore.adjustBalance(params.userId, -params.stake);
    await transactionStore.create({
      userId: params.userId,
      type: 'bet',
      description: `Virtual Football Bet — Matchday #${matchday.round}`,
      amount: -params.stake,
    });

    const bet: VirtualBet = {
      id: `vb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      matchdayId: matchday.id,
      matchdayRound: matchday.round,
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

    return virtualBetStore.create(bet);
  }

  async getBetsForUser(userId: string): Promise<VirtualBet[]> {
    return virtualBetStore.getForUser(userId);
  }

  async getBetById(id: string): Promise<VirtualBet | null> {
    return virtualBetStore.getById(id);
  }

  async getAllBets(): Promise<VirtualBet[]> {
    return virtualBetStore.getAll();
  }

  async getUserSummaries() {
    return virtualBetStore.getUserSummaries();
  }
}

export const virtualEngine = new VirtualEngine();
