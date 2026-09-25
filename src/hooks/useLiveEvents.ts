import { useEffect, useRef, useState } from 'react';
import { fetchLiveEvents } from '../services/oddsApi';
import type { Match } from '../types';

const DEFAULT_REFRESH_MS = 15000;

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
export function useLiveEvents(sport?: string, refreshIntervalMs: number = DEFAULT_REFRESH_MS): UseLiveEventsResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousOddsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const load = async (isFirstLoad: boolean) => {
      if (isFirstLoad) setLoading(true);
      try {
        const fetched = await fetchLiveEvents(sport);
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
    const interval = setInterval(() => load(false), refreshIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sport, refreshIntervalMs]);

  return { matches, loading, error };
}
