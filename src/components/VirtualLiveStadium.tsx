import { useEffect, useMemo, useRef, useState } from 'react';
import TeamCrest from './TeamCrest';
import type { VirtualFixture } from '../types/virtual';

interface VirtualLiveStadiumProps {
  fixtures: VirtualFixture[];
  round: number;
  virtualMinute: number; // 0-90
}

function revealedScore(fixture: VirtualFixture, virtualMinute: number): { home: number; away: number } {
  const events = fixture.result?.goalEvents ?? [];
  let home = 0;
  let away = 0;
  for (const e of events) {
    if (e.minute > virtualMinute) break;
    if (e.team === 'home') home = e.homeScoreAfter;
    else away = e.awayScoreAfter;
  }
  return { home, away };
}

export default function VirtualLiveStadium({ fixtures, round, virtualMinute }: VirtualLiveStadiumProps) {
  const [featuredId, setFeaturedId] = useState(fixtures[0]?.id ?? '');
  const [showAll, setShowAll] = useState(false);
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());
  const [goalBanner, setGoalBanner] = useState<{ team: 'home' | 'away'; key: number } | null>(null);
  const prevScores = useRef<Map<string, { home: number; away: number }>>(new Map());

  useEffect(() => {
    if (!fixtures.some((f) => f.id === featuredId)) {
      setFeaturedId(fixtures[0]?.id ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtures]);

  // Detect goals by comparing each fixture's revealed score against what it
  // was last tick — whichever fixtures just changed get a brief highlight,
  // and if it's the featured match, a full "GOAL!" banner on the pitch.
  useEffect(() => {
    const newlyScored: { id: string; team: 'home' | 'away' }[] = [];

    for (const f of fixtures) {
      const score = revealedScore(f, virtualMinute);
      const prev = prevScores.current.get(f.id);
      if (prev) {
        if (score.home > prev.home) newlyScored.push({ id: f.id, team: 'home' });
        if (score.away > prev.away) newlyScored.push({ id: f.id, team: 'away' });
      }
      prevScores.current.set(f.id, score);
    }

    if (newlyScored.length > 0) {
      setFlashingIds(new Set(newlyScored.map((g) => g.id)));
      setTimeout(() => setFlashingIds(new Set()), 1500);

      const featuredGoal = newlyScored.find((g) => g.id === featuredId);
      if (featuredGoal) {
        setGoalBanner({ team: featuredGoal.team, key: Date.now() });
        setTimeout(() => setGoalBanner(null), 1800);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualMinute, fixtures]);

  const featured = fixtures.find((f) => f.id === featuredId) ?? fixtures[0];
  const half = virtualMinute <= 45 ? '1st Half' : '2nd Half';
  const visibleFixtures = useMemo(() => (showAll ? fixtures : fixtures.slice(0, 6)), [fixtures, showAll]);

  if (!featured) return null;
  const featuredScore = revealedScore(featured, virtualMinute);

  return (
    <div className="mb-3">
      {/* Now playing banner */}
      <div className="flex items-center gap-2 bg-white border border-border rounded-t-card px-3.5 py-2">
        <span className="flex items-center gap-1.5 text-secondary-text font-bold text-error">
          <span className="w-2 h-2 rounded-full bg-error animate-[pulseSoft_1.6s_ease-in-out_infinite]" />
          Now Playing
        </span>
        <span className="text-secondary-text font-semibold text-text-secondary">{half}</span>
        <span className="text-secondary-text font-semibold text-text-secondary ml-auto">Matchday #{round}</span>
      </div>

      {/* Pitch */}
      <div
        className="relative overflow-hidden h-44"
        style={{ background: 'linear-gradient(180deg, #1a7a3c 0%, #15612f 50%, #1a7a3c 100%)' }}
      >
        <div className="absolute inset-3 border-2 border-white/40 rounded-sm" />
        <div className="absolute left-1/2 top-3 bottom-3 w-0 border-l-2 border-white/40" />
        <div className="absolute left-1/2 top-1/2 w-14 h-14 -ml-7 -mt-7 rounded-full border-2 border-white/40" />
        <div className="absolute left-3 top-1/2 w-8 h-16 -mt-8 border-2 border-l-0 border-white/40" />
        <div className="absolute right-3 top-1/2 w-8 h-16 -mt-8 border-2 border-r-0 border-white/40" />

        <div className="absolute top-2.5 left-2.5 bg-navy rounded px-2.5 py-1 flex items-center gap-1.5 z-10">
          <TeamCrest name={featured.homeTeam.name} logoUrl={featured.homeTeam.logoUrl} size={14} />
          <span className="text-micro-text font-bold text-white">{featured.homeTeam.shortName}</span>
        </div>
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-black/50 rounded px-2 py-0.5 z-10">
          <span className="text-micro-text font-bold text-white tabular-nums">
            {featuredScore.home}-{featuredScore.away}
          </span>
        </div>
        <div className="absolute top-2.5 right-2.5 bg-primary rounded px-2.5 py-1 flex items-center gap-1.5 z-10">
          <span className="text-micro-text font-bold text-white">{featured.awayTeam.shortName}</span>
          <TeamCrest name={featured.awayTeam.name} logoUrl={featured.awayTeam.logoUrl} size={14} />
        </div>

        <div className="absolute left-[38%] top-[35%] w-2.5 h-2.5 rounded-full bg-white/90 animate-[playerRoamA_2.6s_ease-in-out_infinite]" />
        <div className="absolute left-[55%] top-[30%] w-2.5 h-2.5 rounded-full bg-navy/90 animate-[playerRoamB_2.2s_ease-in-out_infinite]" />
        <div className="absolute left-[45%] top-[60%] w-2.5 h-2.5 rounded-full bg-white/90 animate-[playerRoamC_2.9s_ease-in-out_infinite]" />
        <div className="absolute left-[62%] top-[65%] w-2.5 h-2.5 rounded-full bg-navy/90 animate-[playerRoamA_2.4s_ease-in-out_infinite_reverse]" />
        <div className="absolute left-[30%] top-[52%] w-2.5 h-2.5 rounded-full bg-navy/90 animate-[playerRoamB_2.8s_ease-in-out_infinite]" />
        <div className="absolute left-[68%] top-[42%] w-2.5 h-2.5 rounded-full bg-white/90 animate-[playerRoamC_2.3s_ease-in-out_infinite_reverse]" />

        <div
          className="absolute w-2 h-2 rounded-full bg-white shadow-md animate-[pitchBallRoam_4s_ease-in-out_infinite]"
          style={{ marginLeft: '-4px', marginTop: '-4px' }}
        />

        {/* Goal celebration overlay */}
        {goalBanner && (
          <div
            key={goalBanner.key}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40"
          >
            <span className="text-4xl mb-1 animate-[bumpIn_0.4s_ease-out]">⚽</span>
            <span className="text-page-title font-extrabold text-white tracking-wide animate-[bumpIn_0.4s_ease-out]">
              GOAL!
            </span>
            <span className="text-secondary-text font-semibold text-white/80">
              {goalBanner.team === 'home' ? featured.homeTeam.shortName : featured.awayTeam.shortName}
            </span>
          </div>
        )}
      </div>

      {/* live score grid */}
      <div className="bg-white border border-t-0 border-border rounded-b-card p-2.5">
        <div className="grid grid-cols-2 gap-2">
          {visibleFixtures.map((f) => {
            const score = revealedScore(f, virtualMinute);
            const isFeatured = f.id === featured.id;
            const isFlashing = flashingIds.has(f.id);
            return (
              <button
                key={f.id}
                onClick={() => setFeaturedId(f.id)}
                className={`flex items-center justify-between px-2 py-1.5 rounded border text-left transition-colors duration-500 ${
                  isFlashing
                    ? 'border-primary bg-primary/25'
                    : isFeatured
                    ? 'border-primary bg-primary-light'
                    : 'border-border bg-card'
                }`}
              >
                <span className="flex items-center gap-1 min-w-0">
                  <TeamCrest name={f.homeTeam.name} logoUrl={f.homeTeam.logoUrl} size={12} />
                  <span className="text-micro-text font-semibold truncate">{f.homeTeam.shortName}</span>
                </span>
                <span className="text-micro-text font-bold tabular-nums px-1">
                  {isFlashing && '⚽ '}
                  {score.home}-{score.away}
                </span>
                <span className="flex items-center gap-1 min-w-0 justify-end">
                  <span className="text-micro-text font-semibold truncate">{f.awayTeam.shortName}</span>
                  <TeamCrest name={f.awayTeam.name} logoUrl={f.awayTeam.logoUrl} size={12} />
                </span>
              </button>
            );
          })}
        </div>
        {fixtures.length > 6 && (
          <button
            onClick={() => setShowAll((s) => !s)}
            className="w-full text-center text-small-text font-semibold text-primary py-2"
          >
            {showAll ? 'Show Less Matches' : 'Show More Matches'}
          </button>
        )}
      </div>
    </div>
  );
}
