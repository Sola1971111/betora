import type { VirtualGoalEvent, VirtualResult } from './types.js';

/** Simple weighted random goal count, 0-6, skewed low, biased by attack strength. */
function randomGoals(attackStrength: number): number {
  const r = Math.random();
  const weights = [0.26, 0.30, 0.21, 0.12, 0.06, 0.03, 0.02].map((w, i) => w * (i === 0 ? 2 - attackStrength : 1));
  const total = weights.reduce((s, w) => s + w, 0);
  let cumulative = 0;
  for (let goals = 0; goals < weights.length; goals++) {
    cumulative += weights[goals] / total;
    if (r <= cumulative) return goals;
  }
  return weights.length - 1;
}

function simulateScore(homeEdge: number): { homeScore: number; awayScore: number } {
  const homeScore = randomGoals(0.6 + homeEdge * 0.6);
  const awayScore = randomGoals(0.6 + (1 - homeEdge) * 0.6);
  return { homeScore, awayScore };
}

/** Builds a sorted minute-by-minute goal timeline for a final score, used to
 * animate the "match" progressively once betting has closed. */
function buildGoalEvents(homeScore: number, awayScore: number): VirtualGoalEvent[] {
  const events: { minute: number; team: 'home' | 'away' }[] = [];
  for (let i = 0; i < homeScore; i++) events.push({ minute: 1 + Math.floor(Math.random() * 90), team: 'home' });
  for (let i = 0; i < awayScore; i++) events.push({ minute: 1 + Math.floor(Math.random() * 90), team: 'away' });
  events.sort((a, b) => a.minute - b.minute);

  let runningHome = 0;
  let runningAway = 0;
  return events.map((e) => {
    if (e.team === 'home') runningHome += 1;
    else runningAway += 1;
    return { minute: e.minute, team: e.team, homeScoreAfter: runningHome, awayScoreAfter: runningAway };
  });
}

/** Determines the full result (score, goal timeline, and winning outcome ids per market). */
export function determineResult(homeEdge: number): VirtualResult {
  const { homeScore, awayScore } = simulateScore(homeEdge);
  const totalGoals = homeScore + awayScore;
  const goalEvents = buildGoalEvents(homeScore, awayScore);

  const h2hWinner = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw';
  const totalsWinner = totalGoals > 2.5 ? 'over-2.5' : 'under-2.5';
  const bttsWinner = homeScore > 0 && awayScore > 0 ? 'gg' : 'ng';

  // Double chance has three outcomes and TWO of them win on any given result
  // (e.g. a home win pays both "1X" and "12"), so store a comma-joined list
  // for this one market; settlement checks membership rather than equality.
  const doubleChanceWinners =
    h2hWinner === 'home' ? ['1x', '12'] : h2hWinner === 'away' ? ['12', 'x2'] : ['1x', 'x2'];

  const inGrid = homeScore <= 4 && awayScore <= 4;
  const correctScoreWinner = inGrid ? `${homeScore}-${awayScore}` : 'other';

  return {
    homeScore,
    awayScore,
    goalEvents,
    winningOutcomeIdsByMarket: {
      h2h: h2hWinner,
      totals: totalsWinner,
      btts: bttsWinner,
      double_chance: doubleChanceWinners.join(','),
      correct_score: correctScoreWinner,
    },
  };
}
