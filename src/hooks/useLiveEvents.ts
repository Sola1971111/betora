import { useEffect, useRef, useState } from 'react';
import { fetchLiveEvents } from '../services/oddsApi';
import type { Match } from '../types';

const DEFAULT_REFRESH_MS = 15000;
// Hard floor, independent of anything the server ever sends — protects
// against a misconfigured or malformed server value (e.g. a blank env var
// silently becoming 0) turning into a runaway request loop that can crash
// the tab. No legitimate reason to poll faster than this exists.
const MIN_REFRESH_MS = 3000;

interface UseLiveEventsResult {
  matches: Match[];
  loading: boolean;
  error: string | null;
}

/**
 * Polls live events on an interval (spec item 14). Does not reload the
 * whole page — just re-fetches this one dataset and updates state in place.
 * The interval defaults to 15s but can be overridden once /api/sports
 * reports the server-configured LIVE_ODDS_REFRESH_INTERVAL.
 */
export function useLiveEvents(
  sport?: string,
  refreshIntervalMs: number = DEFAULT_REFRESH_MS,
  limit?: number
): UseLiveEventsResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousOddsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const load = async (isFirstLoad: boolean) => {
      if (isFirstLoad) setLoading(true);
      try {
        const fetched = await fetchLiveEvents(sport, limit);
        if (cancelled) return;
        const withChangeTracking = fetched.map((match) => ({
          ...match,
          markets: match.markets.map((market) => ({
            ...market,
            selections: market.selections.map((sel) => {
              const key = sel.id;
              const previous = previousOddsRef.current.get(key);
              if (sel.odds !== null) previousOddsRef.current.set(key, sel.odds);
              return previous !== undefined && sel.odds !== null && previous !== sel.odds
                ? { ...sel, previousOdds: previous }
                : sel;
            }),
          })),
        }));
        setMatches(withChangeTracking);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Live data temporarily unavailable');
      } finally {
        if (!cancelled && isFirstLoad) setLoading(false);
      }
    };

    load(true);
    const safeIntervalMs = Number.isFinite(refreshIntervalMs) && refreshIntervalMs >= MIN_REFRESH_MS ? refreshIntervalMs : DEFAULT_REFRESH_MS;
    const interval = setInterval(() => load(false), safeIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sport, refreshIntervalMs, limit]);

  return { matches, loading, error };
}
