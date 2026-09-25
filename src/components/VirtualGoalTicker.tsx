import { useEffect, useState } from 'react';
import TeamCrest from './TeamCrest';
import type { VirtualFixture } from '../types/virtual';

interface RevealedGoal {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string | null;
  awayLogo: string | null;
  minute: number;
  team: 'home' | 'away';
  homeScoreAfter: number;
  awayScoreAfter: number;
  key: string;
}

interface VirtualGoalTickerProps {
  fixtures: VirtualFixture[];
  virtualMinute: number;
}

export default function VirtualGoalTicker({ fixtures, virtualMinute }: VirtualGoalTickerProps) {
  const [feed, setFeed] = useState<RevealedGoal[]>([]);
  const [flashKey, setFlashKey] = useState<string | null>(null);

  useEffect(() => {
    const revealed: RevealedGoal[] = [];
    for (const fixture of fixtures) {
      const events = fixture.result?.goalEvents ?? [];
      for (const event of events) {
        if (event.minute <= virtualMinute) {
          revealed.push({
            fixtureId: fixture.id,
            homeTeam: fixture.homeTeam.shortName,
            awayTeam: fixture.awayTeam.shortName,
            homeLogo: fixture.homeTeam.logoUrl,
            awayLogo: fixture.awayTeam.logoUrl,
            minute: event.minute,
            team: event.team,
            homeScoreAfter: event.homeScoreAfter,
            awayScoreAfter: event.awayScoreAfter,
            key: `${fixture.id}-${event.minute}-${event.team}`,
          });
        }
      }
    }
    revealed.sort((a, b) => b.minute - a.minute);
    setFeed((prev) => {
      const prevKeys = new Set(prev.map((g) => g.key));
      const newest = revealed.find((g) => !prevKeys.has(g.key));
      if (newest) setFlashKey(newest.key);
      return revealed;
    });
  }, [fixtures, virtualMinute]);

  useEffect(() => {
    if (!flashKey) return;
    const t = setTimeout(() => setFlashKey(null), 1200);
    return () => clearTimeout(t);
  }, [flashKey]);

  if (feed.length === 0) {
    return <p className="text-secondary-text text-white/50 text-center py-3">No goals yet…</p>;
  }

  return (
    <div className="space-y-1.5 max-h-40 overflow-y-auto">
      {feed.slice(0, 8).map((goal) => (
        <div
          key={goal.key}
          className={`flex items-center gap-2 px-3 py-2 rounded transition-colors duration-500 ${
            flashKey === goal.key ? 'bg-primary/25' : 'bg-white/5'
          }`}
        >
          <span className="text-micro-text font-bold text-primary flex-shrink-0 w-7">{goal.minute}'</span>
          <TeamCrest
            name={goal.team === 'home' ? goal.homeTeam : goal.awayTeam}
            logoUrl={goal.team === 'home' ? goal.homeLogo : goal.awayLogo}
            size={14}
          />
          <span className="text-secondary-text text-white flex-1 truncate">
            {goal.homeTeam} {goal.homeScoreAfter}-{goal.awayScoreAfter} {goal.awayTeam}
          </span>
          <span className="text-micro-text text-white/40 flex-shrink-0">⚽</span>
        </div>
      ))}
    </div>
  );
}
