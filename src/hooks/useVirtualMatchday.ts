import { useEffect, useState } from 'react';
import { fetchCurrentMatchday } from '../services/virtualApi';
import type { VirtualMatchday } from '../types/virtual';

const POLL_MS = 2000; // frequent — drives the whole betting/in-play/settled UI

interface UseVirtualMatchdayResult {
  matchday: VirtualMatchday | null;
  loading: boolean;
  error: string | null;
  secondsToKickoff: number;
  secondsToSettle: number;
  secondsElapsedInPlay: number;
  matchLengthSeconds: number;
}

export function useVirtualMatchday(): UseVirtualMatchdayResult {
  const [matchday, setMatchday] = useState<VirtualMatchday | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const fetched = await fetchCurrentMatchday();
        if (cancelled) return;
        setMatchday(fetched);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to load the virtual matchday');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const dataInterval = setInterval(load, POLL_MS);
    const clockInterval = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      cancelled = true;
      clearInterval(dataInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const kickoffMs = matchday ? new Date(matchday.kickoffAt).getTime() : 0;
  const settleMs = matchday ? new Date(matchday.settleAt).getTime() : 0;

  const secondsToKickoff = matchday ? Math.max(0, Math.round((kickoffMs - now) / 1000)) : 0;
  const secondsToSettle = matchday ? Math.max(0, Math.round((settleMs - now) / 1000)) : 0;
  const secondsElapsedInPlay = matchday ? Math.max(0, Math.round((now - kickoffMs) / 1000)) : 0;
  const matchLengthSeconds = matchday ? Math.max(1, Math.round((settleMs - kickoffMs) / 1000)) : 1;

  return { matchday, loading, error, secondsToKickoff, secondsToSettle, secondsElapsedInPlay, matchLengthSeconds };
}
