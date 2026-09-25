import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { Match, MarketSelection } from '../types';
import TeamCrest from './TeamCrest';
import { useApp } from '../context/AppContext';
import { approximateElapsed } from '../utils/liveTime';

interface LiveMatchCardProps {
  match: Match;
}

export default function LiveMatchCard({ match }: LiveMatchCardProps) {
  const navigate = useNavigate();
  const { addToSlip, isInSlip } = useApp();
  const mainMarket = match.markets[0];

  // Re-render once a minute so the approximate live clock keeps ticking
  // without needing a full data refetch.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = approximateElapsed(match.date, match.sportId);

  const handleOddsClick = (sel: MarketSelection) => {
    if (!mainMarket || sel.odds === null) return;
    addToSlip({
      id: `${match.id}-${mainMarket.id}-${sel.label}`,
      matchId: match.id,
      matchLabel: `${match.homeTeam} vs ${match.awayTeam}`,
      marketName: mainMarket.name,
      marketKey: mainMarket.key,
      selectionLabel: sel.label,
      odds: sel.odds,
      point: sel.point,
      sport: match.sportId,
      league: match.competitionName,
      startTime: match.date,
    });
  };

  return (
    <div className="relative flex-shrink-0 w-64 rounded-card overflow-hidden bg-navy p-3.5">
      <div
        className="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-20 blur-2xl"
        style={{ background: 'radial-gradient(circle, #DC2626 0%, transparent 70%)' }}
      />
      <button onClick={() => navigate(`/match/${match.id}?sport=${match.sportId}`)} className="relative w-full text-left">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-micro-text text-white/45 uppercase tracking-wide truncate">{match.competitionName}</span>
          <span className="flex items-center gap-1 bg-error/15 px-1.5 py-0.5 rounded-full flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-[pulseSoft_1.6s_ease-in-out_infinite]" />
            <span className="text-micro-text font-bold text-error">{elapsed ?? 'LIVE'}</span>
          </span>
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <TeamCrest name={match.homeTeam} logoUrl={match.homeTeamLogo} size={18} />
            <span className="text-body font-semibold text-white truncate">{match.homeTeam}</span>
          </div>
          <span className="text-section-heading text-white flex-shrink-0 tabular-nums">{match.liveScore?.home}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <TeamCrest name={match.awayTeam} logoUrl={match.awayTeamLogo} size={18} />
            <span className="text-body font-semibold text-white truncate">{match.awayTeam}</span>
          </div>
          <span className="text-section-heading text-white flex-shrink-0 tabular-nums">{match.liveScore?.away}</span>
        </div>
      </button>

      {mainMarket && (
        <div className="relative flex gap-1.5 mt-3">
          {mainMarket.selections.map((sel) => {
            const selected = isInSlip(match.id, mainMarket.name, sel.label);
            const suspended = sel.odds === null;
            return (
              <button
                key={sel.id}
                onClick={() => handleOddsClick(sel)}
                disabled={suspended}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-11 rounded border transition-all duration-150 active:scale-[0.96] ${
                  suspended
                    ? 'bg-white/5 border-white/10 text-white/30 pointer-events-none'
                    : selected
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white/5 border-white/10 text-white hover:border-white/25'
                }`}
              >
                <span className={`text-odds-label ${selected ? 'text-white/85' : 'text-white/50'}`}>{sel.label}</span>
                <span className="text-odds leading-none">{suspended ? '—' : sel.odds!.toFixed(2)}</span>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => navigate(`/match/${match.id}?sport=${match.sportId}`)}
        className="relative w-full flex items-center justify-center gap-1 mt-2.5 pt-2.5 border-t border-white/10 text-micro-text font-semibold text-white/50"
      >
        View Match
        <ChevronRight size={12} />
      </button>
    </div>
  );
}
