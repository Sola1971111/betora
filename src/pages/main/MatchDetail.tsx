import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { RefreshCcw } from 'lucide-react';
import Header from '../../components/Header';
import OddsButton from '../../components/OddsButton';
import Badge from '../../components/Badge';
import TeamCrest from '../../components/TeamCrest';
import { useApp } from '../../context/AppContext';
import { useEvent } from '../../hooks/useEvent';
import { approximateElapsed } from '../../utils/liveTime';
import type { Market, MarketSelection } from '../../types';

function timeAgo(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0 || Number.isNaN(diffMs)) return null;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Updated moments ago';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours}h ago`;
}

export default function MatchDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const sport = searchParams.get('sport');
  const { addToSlip, isInSlip } = useApp();
  const { match, loading, error, notFound } = useEvent(sport, id ?? null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    if (!match) return [];
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const m of match.markets) {
      const cat = m.category ?? 'Other';
      if (!seen.has(cat)) {
        seen.add(cat);
        ordered.push(cat);
      }
    }
    // "Main" first, "Other" last, everything else in the order encountered
    return ordered.sort((a, b) => {
      if (a === 'Main') return -1;
      if (b === 'Main') return 1;
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return 0;
    });
  }, [match]);

  const currentCategory = activeCategory ?? categories[0] ?? null;
  const visibleMarkets: Market[] = match
    ? match.markets.filter((m) => (m.category ?? 'Other') === currentCategory)
    : [];

  const handleOddsClick = (marketName: string, marketKey: string | undefined, sel: MarketSelection) => {
    if (!match || sel.odds === null) return;
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

  if (!sport || !id) {
    return (
      <div className="min-h-screen bg-bg">
        <Header title="Match" showBack showBalance={false} showNotifications={false} />
        <p className="p-6 text-body text-text-secondary">Match not found.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Header title="Match" showBack showBalance={false} showNotifications={false} />
        <p className="p-6 text-body text-text-secondary">Loading match…</p>
      </div>
    );
  }

  if (notFound || !match) {
    return (
      <div className="min-h-screen bg-bg">
        <Header title="Match" showBack showBalance={false} showNotifications={false} />
        <p className="p-6 text-body text-text-secondary">Match not found.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg">
        <Header title="Match" showBack showBalance={false} showNotifications={false} />
        <div className="flex flex-col items-center text-center py-14 px-6">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-3">
            <RefreshCcw size={20} className="text-error" />
          </div>
          <p className="text-card-heading mb-1">Unable to load match</p>
          <p className="text-secondary-text text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  const updated = timeAgo(match.lastUpdate);

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Header title={match.competitionName} showBack showBalance={false} showNotifications={false} />

      <div className="max-w-app mx-auto">
        <div className="bg-card border-b border-border px-4 py-4 text-center">
          {match.status === 'live' ? (
            <Badge variant="live">{`LIVE · ${approximateElapsed(match.date, match.sportId) ?? 'In Progress'}`}</Badge>
          ) : (
            <span className="text-small-text text-text-secondary">
              {new Date(match.date).toLocaleString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <div className="flex items-center justify-center gap-4 mt-2.5">
            <div className="flex items-center gap-1.5">
              <TeamCrest name={match.homeTeam} logoUrl={match.homeTeamLogo} size={20} />
              <span className="text-card-heading">{match.homeTeam}</span>
            </div>
            {match.status === 'live' && match.liveScore ? (
              <span className="text-section-heading text-primary tabular-nums">
                {match.liveScore.home} - {match.liveScore.away}
              </span>
            ) : (
              <span className="text-secondary-text text-text-secondary">vs</span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-card-heading">{match.awayTeam}</span>
              <TeamCrest name={match.awayTeam} logoUrl={match.awayTeamLogo} size={20} />
            </div>
          </div>
          {updated && <p className="text-micro-text text-text-secondary mt-2">{updated}</p>}
        </div>

        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 border-b border-border">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3.5 h-8 rounded-full text-secondary-text font-semibold transition-colors duration-150 ${
                  currentCategory === cat ? 'bg-primary text-white' : 'bg-slate-100 text-text-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="px-4 py-3.5 space-y-4">
          {visibleMarkets.length === 0 ? (
            <p className="text-secondary-text text-text-secondary text-center py-8">No markets available</p>
          ) : (
            visibleMarkets.map((market) => (
              <div key={market.id}>
                <h3 className="text-card-heading mb-2">{market.name}</h3>
                <div className="flex gap-1.5 flex-wrap">
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
