import type { VirtualMarket, VirtualOutcome } from './types.js';

const MARGIN = 1.07; // ~7% overround, typical of a real bookmaker's book

function toOdds(probability: number): number {
  const raw = 1 / Math.max(0.001, probability);
  return Math.max(1.01, Math.round(raw * MARGIN * 100) / 100);
}

/** Home advantage plus a random swing, clamped to a believable range. */
function randomHomeEdge(): number {
  return 0.5 + (Math.random() - 0.5) * 0.3; // roughly 0.35–0.65
}

interface H2HProbs {
  home: number;
  draw: number;
  away: number;
}

function computeH2HProbs(homeEdge: number): H2HProbs {
  const draw = 0.24 + Math.random() * 0.06; // 24–30%
  const remaining = 1 - draw;
  return { home: remaining * homeEdge, draw, away: remaining * (1 - homeEdge) };
}

function buildH2HMarket(probs: H2HProbs): VirtualMarket {
  return {
    key: 'h2h',
    title: 'Match Result',
    outcomes: [
      { id: 'home', label: '1', odds: toOdds(probs.home) },
      { id: 'draw', label: 'X', odds: toOdds(probs.draw) },
      { id: 'away', label: '2', odds: toOdds(probs.away) },
    ],
  };
}

function buildDoubleChanceMarket(probs: H2HProbs): VirtualMarket {
  return {
    key: 'double_chance',
    title: 'Double Chance',
    outcomes: [
      { id: '1x', label: '1X', odds: toOdds(probs.home + probs.draw) },
      { id: '12', label: '12', odds: toOdds(probs.home + probs.away) },
      { id: 'x2', label: 'X2', odds: toOdds(probs.draw + probs.away) },
    ],
  };
}

function buildTotalsMarket(): { market: VirtualMarket; overProb: number } {
  const overProb = 0.42 + Math.random() * 0.16; // 42–58%
  return {
    market: {
      key: 'totals',
      title: 'Total Goals O/U 2.5',
      outcomes: [
        { id: 'over-2.5', label: 'Over 2.5', odds: toOdds(overProb) },
        { id: 'under-2.5', label: 'Under 2.5', odds: toOdds(1 - overProb) },
      ],
    },
    overProb,
  };
}

function buildBttsMarket(homeEdge: number): VirtualMarket {
  // Roughly: more balanced matches (homeEdge near 0.5) have a higher chance
  // both teams score than heavily lopsided ones.
  const balance = 1 - Math.abs(homeEdge - 0.5) * 2; // 0 (lopsided) .. 1 (even)
  const yesProb = 0.42 + balance * 0.16; // 42–58%
  return {
    key: 'btts',
    title: 'Both Teams To Score',
    outcomes: [
      { id: 'gg', label: 'GG', odds: toOdds(yesProb) },
      { id: 'ng', label: 'NG', odds: toOdds(1 - yesProb) },
    ],
  };
}

// Full 0-4 x 0-4 grid (25 lines) plus a catch-all "Other" outcome for any
// scoreline where either side scores 5 or more — so every possible actual
// result always has a matching winning outcome somewhere in this market.
function buildCorrectScoreMarket(homeEdge: number): VirtualMarket {
  const lines: { home: number; away: number }[] = [];
  for (let h = 0; h <= 4; h++) {
    for (let a = 0; a <= 4; a++) lines.push({ home: h, away: a });
  }

  const weights = lines.map(({ home, away }) => {
    const diff = home - away;
    const favoursHome = diff > 0 ? homeEdge : diff < 0 ? 1 - homeEdge : 0.55;
    const totalGoals = home + away;
    const goalsPenalty = Math.max(0.15, 1 - totalGoals * 0.11);
    return favoursHome * goalsPenalty;
  });
  const gridTotal = weights.reduce((sum, w) => sum + w, 0);

  // Reserve a slice of probability mass for "Other" (5+ goals for either side).
  const otherProb = 0.06;
  const gridProbMass = 1 - otherProb;

  const outcomes: VirtualOutcome[] = lines.map((line, i) => ({
    id: `${line.home}-${line.away}`,
    label: `${line.home}-${line.away}`,
    odds: toOdds(Math.max(0.003, (weights[i] / gridTotal) * gridProbMass)),
  }));

  outcomes.push({ id: 'other', label: 'Other', odds: toOdds(otherProb) });

  return { key: 'correct_score', title: 'Correct Score', outcomes };
}

export function generateFixtureMarkets(): { markets: VirtualMarket[]; homeEdge: number; overProb: number } {
  const homeEdge = randomHomeEdge();
  const probs = computeH2HProbs(homeEdge);
  const { market: totalsMarket, overProb } = buildTotalsMarket();

  return {
    markets: [
      buildH2HMarket(probs),
      totalsMarket,
      buildDoubleChanceMarket(probs),
      buildBttsMarket(homeEdge),
      buildCorrectScoreMarket(homeEdge),
    ],
    homeEdge,
    overProb,
  };
}
