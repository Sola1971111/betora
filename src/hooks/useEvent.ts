import { useEffect, useRef, useState } from 'react';
import { fetchEventById } from '../services/oddsApi';
import type { Match } from '../types';

const LIVE_REFETCH_MS = 15000;

interface UseEventResult {
  match: Match | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

export function useEvent(sport: string | null, id: string | null): UseEventResult {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const previousOddsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!sport || !id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    const load = async (isFirstLoad: boolean) => {
      if (isFirstLoad) {
        setLoading(true);
        setError(null);
        setNotFound(false);
      }
      try {
        const fetched = await fetchEventById(sport, id);
        if (cancelled) return;

        const withChangeTracking: Match = {
          ...fetched,
          markets: fetched.markets.map((market) => ({
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
        };
        setMatch(withChangeTracking);

        // Once we know this match is live, start polling for fresh score/odds.
        // A match that starts upcoming and later goes live will pick this up
        // on its next fetch since the interval is (re)armed here.
        if (withChangeTracking.status === 'live' && !interval) {
          interval = setInterval(() => load(false), LIVE_REFETCH_MS);
        }
        if (withChangeTracking.status !== 'live' && interval) {
          clearInterval(interval);
          interval = undefined;
        }
      } catch (err) {
        if (cancelled) return;
        if (err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : 'Unable to load match');
        }
      } finally {
        if (!cancelled && isFirstLoad) setLoading(false);
      }
    };

    load(true);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [sport, id]);

  return { match, loading, error, notFound };
}
