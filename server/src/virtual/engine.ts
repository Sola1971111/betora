import { pickMatchdayFixtures, prefetchTeamLogos } from './teams.js';
import { generateFixtureMarkets } from './oddsGenerator.js';
import { determineResult } from './simulate.js';
import { virtualConfig } from '../config.js';
import { userStore } from '../users/store.js';
import { notificationStore } from '../notifications/store.js';
import { virtualBetStore } from './betStore.js';
import type {
  PublicVirtualFixture,
  PublicVirtualMatchday,
  VirtualBet,
  VirtualBetSelection,
  VirtualFixture,
  VirtualMatchday,
} from './types.js';

const FIXTURES_PER_MATCHDAY = 9;
const LOOKAHEAD_COUNT = 5;

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('[VIRTUAL]', ...args);
}

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
  const revealResults = matchday.phase !== 'betting';
  return {
    ...matchday,
    fixtures: matchday.fixtures.map((f) => (revealResults ? f : stripResult(f))),
  };
}

class VirtualEngine {
  private queue: VirtualMatchday[] = [];
  private round = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  async start() {
    if (this.timer || this.queue.length > 0) return;

    await prefetchTeamLogos();

    for (let i = 0; i < LOOKAHEAD_COUNT + 1; i++) {
      this.round += 1;
      this.queue.push(buildMatchdayContent(this.round));
    }

    log(`Started — round ${this.queue[0].round} activating, ${LOOKAHEAD_COUNT} future matchdays queued`);
    this.activateCurrent();
  }

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

  private async settle() {
    const current = this.queue[0];
    if (!current) return;
    current.phase = 'settled';

    log(
      `Round ${current.round}: settled — ` +
        current.fixtures
          .map((f) => `${f.homeTeam.shortName} ${f.result.homeScore}-${f.result.awayScore} ${f.awayTeam.shortName}`)
          .join(', ')
    );

    await this.settleBetsForMatchday(current);

    const remainingMs = new Date(current.nextCycleAt).getTime() - Date.now();
    this.schedule(() => this.advanceQueue(), Math.max(0, remainingMs));
  }

  private advanceQueue() {
    this.queue.shift();
    this.round += 1;
    this.queue.push(buildMatchdayContent(this.round));
    this.activateCurrent();
  }

  private schedule(fn: () => void | Promise<void>, delayMs: number) {
    this.timer = setTimeout(() => {
      Promise.resolve(fn()).catch((err) => {
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
      });
    }, delayMs);
  }

  private async settleBetsForMatchday(matchday: VirtualMatchday) {
    const fixtureResults = new Map(matchday.fixtures.map((f) => [f.id, f.result]));
    const pendingBets = await virtualBetStore.getPendingForMatchday(matchday.id);

    for (const bet of pendingBets) {
      const allWon = bet.selections.every((sel) => {
        const result = fixtureResults.get(sel.fixtureId);
        if (!result) return false;
        const winners = (result.winningOutcomeIdsByMarket[sel.marketKey] ?? '').split(',');
        return winners.includes(sel.outcomeId);
      });

      await virtualBetStore.settle(bet.id, allWon ? 'won' : 'lost');

      if (allWon) {
        try {
          await userStore.adjustBalance(bet.userId, bet.potentialWin, true);
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

  getCurrentMatchday(): PublicVirtualMatchday {
    const current = this.queue[0];
    if (!current) throw new Error('Virtual engine not started');
    return toPublicMatchday(current);
  }

  getUpcomingMatchdaysForAdmin(count: number = LOOKAHEAD_COUNT + 1): VirtualMatchday[] {
    return this.queue.slice(0, count);
  }

  async placeBet(params: {
    userId: string;
    userLabel: string;
    stake: number;
    picks: { fixtureId: string; marketKey: string; outcomeId: string }[];
  }): Promise<VirtualBet> {
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
        odds: outcome.odds,
      };
    });

    const combinedOdds = selections.reduce((acc, s) => acc * s.odds, 1);

    await userStore.adjustBalance(params.userId, -params.stake);

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

    return virtualBetStore.create(bet);
  }

  async getBetsForUser(userId: string): Promise<VirtualBet[]> {
    return virtualBetStore.getForUser(userId);
  }

  async getAllBets(): Promise<VirtualBet[]> {
    return virtualBetStore.getAll();
  }

  async getUserSummaries() {
    return virtualBetStore.getUserSummaries();
  }
}

export const virtualEngine = new VirtualEngine();