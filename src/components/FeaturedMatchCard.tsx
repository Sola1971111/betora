import { useNavigate } from 'react-router-dom';
import type { Match, MarketSelection } from '../types';
import TeamCrest from './TeamCrest';
import { useApp } from '../context/AppContext';

interface FeaturedMatchCardProps {
  match: Match;
}

function formatKickoff(date: string) {
  const d = new Date(date);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return isToday ? `Tonight · ${time}` : `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · ${time}`;
}

export default function FeaturedMatchCard({ match }: FeaturedMatchCardProps) {
  const navigate = useNavigate();
  const { addToSlip, isInSlip } = useApp();
  const mainMarket = match.markets[0];

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
    <div className="relative rounded-card overflow-hidden bg-navy p-4 shadow-glow-green">
      <div
        className="pointer-events-none absolute -top-12 -left-8 w-48 h-48 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #16A34A 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 19px, #fff 19px, #fff 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #fff 19px, #fff 20px)',
        }}
      />
      <button onClick={() => navigate(`/match/${match.id}?sport=${match.sportId}`)} className="relative w-full text-left">
        <div className="flex items-center justify-between mb-3">
          <span className="text-micro-text font-bold text-primary tracking-wide uppercase">Featured Match</span>
          <span className="text-micro-text text-white/45 uppercase tracking-wide">{formatKickoff(match.date)}</span>
        </div>
        <p className="text-micro-text text-white/40 uppercase tracking-wide mb-2">{match.competitionName}</p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <TeamCrest name={match.homeTeam} logoUrl={match.homeTeamLogo} size={26} />
            <span className="text-card-heading text-white truncate">{match.homeTeam}</span>
          </div>
          <span className="text-small-text text-white/35 flex-shrink-0">vs</span>
          <div className="flex items-center gap-2 min-w-0 flex-row-reverse">
            <TeamCrest name={match.awayTeam} logoUrl={match.awayTeamLogo} size={26} />
            <span className="text-card-heading text-white truncate">{match.awayTeam}</span>
          </div>
        </div>
      </button>

      {mainMarket && (
        <div className="relative flex gap-2 mt-4">
          {mainMarket.selections.map((sel) => {
            const selected = isInSlip(match.id, mainMarket.name, sel.label);
            const suspended = sel.odds === null;
            return (
              <button
                key={sel.id}
                onClick={() => handleOddsClick(sel)}
                disabled={suspended}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-12 rounded border transition-all duration-150 active:scale-[0.97] ${
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
    </div>
  );
}
