import type { VirtualTeam } from './types.js';
import { getTeamLogos } from '../teamLogos.js';

// Real EPL club names, used only as fixture labels for a simulated/virtual
// game mode — no real-world data, live odds, or actual results are involved.
// Logos are fetched once at startup (see prefetchLogos) via TheSportsDB, the
// same free service used for real-match team crests.
const TEAM_SEED: Omit<VirtualTeam, 'logoUrl'>[] = [
  { id: 'arsenal', name: 'Arsenal', shortName: 'ARS' },
  { id: 'aston-villa', name: 'Aston Villa', shortName: 'AVL' },
  { id: 'bournemouth', name: 'Bournemouth', shortName: 'BOU' },
  { id: 'brentford', name: 'Brentford', shortName: 'BRE' },
  { id: 'brighton', name: 'Brighton', shortName: 'BHA' },
  { id: 'chelsea', name: 'Chelsea', shortName: 'CHE' },
  { id: 'crystal-palace', name: 'Crystal Palace', shortName: 'CRY' },
  { id: 'everton', name: 'Everton', shortName: 'EVE' },
  { id: 'fulham', name: 'Fulham', shortName: 'FUL' },
  { id: 'liverpool', name: 'Liverpool', shortName: 'LIV' },
  { id: 'man-city', name: 'Manchester City', shortName: 'MCI' },
  { id: 'man-united', name: 'Manchester United', shortName: 'MUN' },
  { id: 'newcastle', name: 'Newcastle United', shortName: 'NEW' },
  { id: 'nottingham-forest', name: 'Nottingham Forest', shortName: 'NFO' },
  { id: 'tottenham', name: 'Tottenham Hotspur', shortName: 'TOT' },
  { id: 'west-ham', name: 'West Ham United', shortName: 'WHU' },
  { id: 'wolves', name: 'Wolverhampton Wanderers', shortName: 'WOL' },
  { id: 'leeds', name: 'Leeds United', shortName: 'LEE' },
  { id: 'sunderland', name: 'Sunderland', shortName: 'SUN' },
  { id: 'burnley', name: 'Burnley', shortName: 'BUR' },
];

let EPL_TEAMS: VirtualTeam[] = TEAM_SEED.map((t) => ({ ...t, logoUrl: null }));

/** Fetches real crest images for every virtual team once, at server startup. */
export async function prefetchTeamLogos(): Promise<void> {
  try {
    const logos = await getTeamLogos(TEAM_SEED.map((t) => t.name));
    EPL_TEAMS = TEAM_SEED.map((t) => ({ ...t, logoUrl: logos[t.name] ?? null }));
    // eslint-disable-next-line no-console
    console.log(`[VIRTUAL] Loaded crest logos for ${Object.values(logos).filter(Boolean).length}/${TEAM_SEED.length} teams`);
  } catch {
    // Logos are a visual nicety — never block the engine from starting over this.
    // eslint-disable-next-line no-console
    console.log('[VIRTUAL] Could not prefetch team logos — falling back to initials badges');
  }
}

/** Picks `count` non-overlapping home/away pairs for one matchday. */
export function pickMatchdayFixtures(count: number): [VirtualTeam, VirtualTeam][] {
  const pool = [...EPL_TEAMS].sort(() => Math.random() - 0.5);
  const pairs: [VirtualTeam, VirtualTeam][] = [];
  const maxPairs = Math.min(count, Math.floor(pool.length / 2));
  for (let i = 0; i < maxPairs; i++) {
    pairs.push([pool[i * 2], pool[i * 2 + 1]]);
  }
  return pairs;
}
