/**
 * The Odds API's live scores endpoint reports whether a match is in
 * progress but not the exact match clock. Rather than showing nothing (or
 * a broken "undefined'"), this derives an honest approximate elapsed time
 * from kickoff, capped to a sport's typical match length, and marks it
 * clearly as approximate with a leading "~".
 */
export function approximateElapsed(startTime: string, sport: string): string | null {
  const start = new Date(startTime).getTime();
  if (Number.isNaN(start)) return null;
  const elapsedMs = Date.now() - start;
  if (elapsedMs < 0) return null;

  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  if (sport === 'football') {
    if (elapsedMinutes > 130) return null; // well past any realistic full-time — stale data, don't guess
    const capped = Math.min(elapsedMinutes, 90);
    return `~${capped}'`;
  }

  if (sport === 'basketball') {
    if (elapsedMinutes > 200) return null;
    return '~Live';
  }

  if (sport === 'tennis') {
    if (elapsedMinutes > 300) return null;
    return '~Live';
  }

  return null;
}
