import { TtlCache } from './cache.js';

const SPORTSDB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json/123';
const LOGO_TTL_MS = 24 * 60 * 60_000; // team crests essentially never change — cache a full day
const NOT_FOUND_TTL_MS = 6 * 60 * 60_000; // still cache "we looked and found nothing" so we don't retry every request
const FETCH_TIMEOUT_MS = 5000;

const cache = new TtlCache();

interface SportsDbTeam {
  strTeam: string;
  strBadge: string | null;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Looks up a team's crest/badge image URL by name via TheSportsDB's free
 * search endpoint. Returns null if nothing is found or the lookup fails —
 * callers must treat that as "no logo available" and fall back to a
 * placeholder, never break the UI over a missing image (spec item 27).
 */
export async function getTeamLogo(teamName: string): Promise<string | null> {
  const cacheKey = `logo-${teamName.toLowerCase()}`;
  const cached = cache.get<string | null>(cacheKey);
  if (cached !== undefined) return cached;

  return cache.dedupe(cacheKey, async () => {
    try {
      const url = `${SPORTSDB_BASE_URL}/searchteams.php?t=${encodeURIComponent(teamName)}`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        cache.set(cacheKey, null, NOT_FOUND_TTL_MS);
        return null;
      }
      const data = (await res.json()) as { teams: SportsDbTeam[] | null };
      const badge = data.teams?.[0]?.strBadge ?? null;
      cache.set(cacheKey, badge, badge ? LOGO_TTL_MS : NOT_FOUND_TTL_MS);
      return badge;
    } catch {
      // Network error, timeout, or malformed response — never let a logo
      // lookup failure break match data.
      cache.set(cacheKey, null, NOT_FOUND_TTL_MS);
      return null;
    }
  });
}

/** Batch lookup for several team names at once, deduped. */
export async function getTeamLogos(teamNames: string[]): Promise<Record<string, string | null>> {
  const unique = Array.from(new Set(teamNames));
  const results = await Promise.allSettled(unique.map((name) => getTeamLogo(name)));
  const map: Record<string, string | null> = {};
  unique.forEach((name, i) => {
    const result = results[i];
    map[name] = result.status === 'fulfilled' ? result.value : null;
  });
  return map;
}
