import { useEffect, useRef, useState } from 'react';
import { fetchEvents } from '../services/oddsApi';
import type { Match } from '../types';

interface UseEventsResult {
  matches: Match[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Fetches upcoming events for a Betora sport (football/basketball/tennis).
 * Re-fetches carry forward the previous odds onto each selection as
 * `previousOdds`, so OddsButton can show the change indicator (spec item 15).
 */
export function useEvents(sport: string | null): UseEventsResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const previousOddsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!sport) {
      setMatches([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchEvents(sport)
      .then((fetched) => {
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
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to load matches');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sport, retryToken]);

  return { matches, loading, error, retry: () => setRetryToken((t) => t + 1) };
}
