import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { Match, MarketSelection } from '../types';
import OddsButton from './OddsButton';
import TeamCrest from './TeamCrest';
import { useApp } from '../context/AppContext';
import Badge from './Badge';
import { approximateElapsed } from '../utils/liveTime';

interface MatchCardProps {
  match: Match;
}

function formatMatchTime(date: string, status: Match['status']) {
  if (status === 'live') return 'LIVE';
  const d = new Date(date);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return isToday ? `Today, ${time}` : `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, ${time}`;
}

export default function MatchCard({ match }: MatchCardProps) {
  const navigate = useNavigate();
  const { addToSlip, isInSlip } = useApp();
  const mainMarket = match.markets[0];
  // Show up to 2 more markets inline (e.g. Totals, BTTS) beyond the main
  // Match Result row, so the card feels like a real bookie listing rather
  // than a single-market teaser. Anything past that stays behind "+N Markets".
  const secondaryMarkets = match.markets.slice(1, 3);
  const shownMarketsCount = 1 + secondaryMarkets.length;
  const extraMarkets = (match.totalMarketsCount ?? match.markets.length) - shownMarketsCount;

  const handleOddsClick = (marketName: string, marketKey: string | undefined, sel: MarketSelection) => {
    if (sel.odds === null) return; // suspended — never selectable
    addToSlip({
      id: `${match.id}-${marketName}-${sel.label}-${sel.point ?? ''}`,
      matchId: match.id,
      matchLabel: `${match.homeTeam} vs ${match.awayTeam}`,
      marketName,
      marketKey,
      selectionLabel: sel.label,
      odds: sel.odds,
      point: sel.point,
      sport: match.sportId,
      league: match.competitionName,
      startTime: match.date,
    });
  };

  return (
    <div className="bg-card border border-border rounded-card p-3 shadow-subtle">
      <button onClick={() => navigate(`/match/${match.id}?sport=${match.sportId}`)} className="w-full text-left">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-small-text text-text-secondary truncate">{match.competitionName}</span>
          {match.status === 'live' ? (
            <Badge variant="live">{`LIVE ${approximateElapsed(match.date, match.sportId) ?? ''}`.trim()}</Badge>
          ) : (
            <span className="text-small-text text-text-secondary flex-shrink-0">
              {formatMatchTime(match.date, match.status)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <TeamCrest name={match.homeTeam} logoUrl={match.homeTeamLogo} />
            <span className="text-card-heading truncate">{match.homeTeam}</span>
          </div>
          {match.status === 'live' && match.liveScore && (
            <span className="text-card-heading text-primary flex-shrink-0 tabular-nums">{match.liveScore.home}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <TeamCrest name={match.awayTeam} logoUrl={match.awayTeamLogo} />
            <span className="text-card-heading truncate">{match.awayTeam}</span>
          </div>
          {match.status === 'live' && match.liveScore && (
            <span className="text-card-heading text-primary flex-shrink-0 tabular-nums">{match.liveScore.away}</span>
          )}
        </div>
      </button>

      {mainMarket ? (
        <>
          <div className="flex gap-1.5 mt-2.5">
            {mainMarket.selections.map((sel) => (
              <OddsButton
                key={sel.id}
                label={sel.label}
                odds={sel.odds}
                previousOdds={sel.previousOdds}
                selected={isInSlip(match.id, mainMarket.name, sel.label)}
                onClick={() => handleOddsClick(mainMarket.name, mainMarket.key, sel)}
              />
            ))}
          </div>

          {secondaryMarkets.map((market) => (
            <div key={market.id} className="mt-2">
              <p className="text-micro-text font-semibold text-text-secondary uppercase tracking-wide mb-1">
                {market.name}
              </p>
              <div className="flex gap-1.5">
                {market.selections.map((sel) => (
                  <OddsButton
                    key={sel.id}
                    label={sel.point !== null && sel.point !== undefined ? `${sel.label} ${sel.point}` : sel.label}
                    odds={sel.odds}
                    previousOdds={sel.previousOdds}
                    selected={isInSlip(match.id, market.name, sel.label)}
                    onClick={() => handleOddsClick(market.name, market.key, sel)}
                  />
                ))}
              </div>
            </div>
          ))}

          {extraMarkets > 0 && (
            <button
              onClick={() => navigate(`/match/${match.id}?sport=${match.sportId}`)}
              className="w-full flex items-center justify-center gap-1 mt-2.5 pt-2 border-t border-border text-small-text font-medium text-text-secondary"
            >
              +{extraMarkets} Markets
              <ChevronRight size={12} />
            </button>
          )}
        </>
      ) : (
        <p className="text-small-text text-text-secondary mt-2.5 text-center py-1">No markets available</p>
      )}
    </div>
  );
}
