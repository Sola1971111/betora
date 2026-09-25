import { useEffect, useState } from 'react';
import { fetchSports, type SportsAndCompetitions } from '../services/oddsApi';

interface UseSportsResult {
  data: SportsAndCompetitions | null;
  loading: boolean;
  error: string | null;
}

let cached: SportsAndCompetitions | null = null;

export function useSports(): UseSportsResult {
  const [data, setData] = useState<SportsAndCompetitions | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSports()
      .then((result) => {
        if (cancelled) return;
        cached = result;
        setData(result);
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
  }, []);

  return { data, loading, error };
}
