import { ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Match, MarketSelection } from '../types';
import { useApp } from '../context/AppContext';
import { approximateElapsed } from '../utils/liveTime';

interface LiveEventRowProps {
  match: Match;
}

function OddsCell({ sel, onClick, selected }: { sel: MarketSelection; onClick: () => void; selected: boolean }) {
  const suspended = sel.odds === null;
  const direction =
    sel.odds !== null && sel.previousOdds !== undefined
      ? sel.odds > sel.previousOdds
        ? 'up'
        : sel.odds < sel.previousOdds
        ? 'down'
        : null
      : null;

  return (
    <button
      onClick={onClick}
      disabled={suspended}
      className={`flex-1 flex items-center justify-center gap-1 h-12 rounded border transition-all duration-150 active:scale-[0.96] ${
        suspended
          ? 'bg-slate-100 border-border text-text-secondary/40 pointer-events-none'
          : selected
          ? 'bg-primary border-primary text-white'
          : direction === 'up'
          ? 'bg-primary-light border-primary/40 text-primary animate-[oddsFlashUp_1.2s_ease-out]'
          : direction === 'down'
          ? 'bg-error/10 border-error/30 text-error animate-[oddsFlashDown_1.2s_ease-out]'
          : 'bg-card border-border text-navy'
      }`}
    >
      <span className="text-odds font-bold">{suspended ? '—' : sel.odds!.toFixed(2)}</span>
      {direction === 'up' && <ArrowUp size={12} />}
      {direction === 'down' && <ArrowDown size={12} />}
    </button>
  );
}

export default function LiveEventRow({ match }: LiveEventRowProps) {
  const navigate = useNavigate();
  const { addToSlip, isInSlip } = useApp();
  const mainMarket = match.markets[0];
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
    <div className="border-b border-border py-2.5">
      <button
        onClick={() => navigate(`/match/${match.id}?sport=${match.sportId}`)}
        className="w-full flex items-center gap-2 mb-2 text-left"
      >
        <span className="flex items-center gap-1 bg-error/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-error animate-[pulseSoft_1.6s_ease-in-out_infinite]" />
          <span className="text-micro-text font-bold text-error">{elapsed ?? 'LIVE'}</span>
        </span>
        <span className="text-micro-text text-text-secondary truncate">{match.competitionName}</span>
        <ChevronRight size={13} className="text-text-secondary flex-shrink-0 ml-auto" />
      </button>

      <button
        onClick={() => navigate(`/match/${match.id}?sport=${match.sportId}`)}
        className="w-full flex items-center justify-between mb-1 text-left"
      >
        <span className="text-body font-semibold truncate pr-2">{match.homeTeam}</span>
        <span className="text-body font-bold tabular-nums flex-shrink-0">{match.liveScore?.home ?? 0}</span>
      </button>
      <button
        onClick={() => navigate(`/match/${match.id}?sport=${match.sportId}`)}
        className="w-full flex items-center justify-between mb-2.5 text-left"
      >
        <span className="text-body font-semibold truncate pr-2">{match.awayTeam}</span>
        <span className="text-body font-bold tabular-nums flex-shrink-0">{match.liveScore?.away ?? 0}</span>
      </button>

      {mainMarket && (
        <div className="flex gap-1.5">
          {mainMarket.selections.map((sel) => (
            <OddsCell
              key={sel.id}
              sel={sel}
              selected={isInSlip(match.id, mainMarket.name, sel.label)}
              onClick={() => handleOddsClick(sel)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
