import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { RefreshCcw } from 'lucide-react';
import Header from '../../components/Header';
import Badge from '../../components/Badge';
import TeamCrest from '../../components/TeamCrest';
import MarketSection from '../../components/MarketSection';
import { useApp } from '../../context/AppContext';
import { useEvent } from '../../hooks/useEvent';
import { approximateElapsed } from '../../utils/liveTime';
import type { Market, MarketSelection } from '../../types';

const MARKETS_PAGE_SIZE = 5;

// Category display order — "Main" always first, "Other" always last,
// everything else in this order when present.
const CATEGORY_ORDER = ['Main', 'Goals', 'Half', 'Handicap', 'Corners', 'Cards', 'Correct Score', 'Team', 'Player', 'Specials', 'Other'];

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
  const [visibleCount, setVisibleCount] = useState(MARKETS_PAGE_SIZE);

  const categories = useMemo(() => {
    if (!match) return [];
    const present = new Set(match.markets.map((m) => m.category ?? 'Other'));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [match]);

  const currentCategory = activeCategory ?? categories[0] ?? null;

  // Reset "show more" whenever the category changes, so switching tabs
  // doesn't carry over an expanded count from a totally different list.
  useEffect(() => {
    setVisibleCount(MARKETS_PAGE_SIZE);
  }, [currentCategory]);

  const categoryMarkets: Market[] = useMemo(
    () => (match ? match.markets.filter((m) => (m.category ?? 'Other') === currentCategory) : []),
    [match, currentCategory]
  );
  const visibleMarkets = categoryMarkets.slice(0, visibleCount);

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
    <div className="min-h-screen bg-bg pb-24 overflow-x-hidden">
      <Header title={match.competitionName} showBack showBalance={false} showNotifications={false} />

      <div className="max-w-app mx-auto">
        {/* Compact match header */}
        <div className="bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0">
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
            </div>
            {updated && <p className="text-micro-text text-text-secondary flex-shrink-0">{updated}</p>}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <TeamCrest name={match.homeTeam} logoUrl={match.homeTeamLogo} size={22} />
              <span className="text-card-heading truncate">{match.homeTeam}</span>
            </div>
            {match.status === 'live' && match.liveScore ? (
              <span className="text-card-heading text-primary tabular-nums flex-shrink-0">
                {match.liveScore.home} - {match.liveScore.away}
              </span>
            ) : (
              <span className="text-small-text text-text-secondary flex-shrink-0">vs</span>
            )}
            <div className="flex items-center gap-1.5 min-w-0 flex-row-reverse">
              <TeamCrest name={match.awayTeam} logoUrl={match.awayTeamLogo} size={22} />
              <span className="text-card-heading truncate">{match.awayTeam}</span>
            </div>
          </div>
        </div>

        {/* Sticky category tabs */}
        {categories.length > 1 && (
          <div className="sticky top-0 z-10 bg-bg flex gap-2 overflow-x-auto no-scrollbar px-4 py-2.5 border-b border-border">
            {categories.map((cat) => {
              const count = match.markets.filter((m) => (m.category ?? 'Other') === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3.5 h-8 rounded-full text-secondary-text font-semibold transition-colors duration-150 whitespace-nowrap ${
                    currentCategory === cat ? 'bg-primary text-white' : 'bg-slate-100 text-text-secondary'
                  }`}
                >
                  {cat}
                  <span className={currentCategory === cat ? 'text-white/70' : 'text-text-secondary/60'}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="px-4 py-3.5 space-y-3 max-w-full">
          {visibleMarkets.length === 0 ? (
            <p className="text-secondary-text text-text-secondary text-center py-8">No markets available</p>
          ) : (
            <>
              {visibleMarkets.map((market, i) => (
                <MarketSection
                  key={market.id}
                  market={market}
                  matchId={match.id}
                  // The first couple of markets in a category (by priority,
                  // already sorted server-side) are the common ones — start
                  // expanded. The rest start collapsed so the page is easy
                  // to scan rather than one long wall of odds.
                  defaultExpanded={i < 2}
                  isSelected={(marketName, label) => isInSlip(match.id, marketName, label)}
                  onSelect={(sel) => handleOddsClick(market.name, market.key, sel)}
                />
              ))}

              {categoryMarkets.length > visibleCount && (
                <button
                  onClick={() => setVisibleCount((v) => v + MARKETS_PAGE_SIZE)}
                  className="w-full text-center py-3 text-secondary-text font-semibold text-primary"
                >
                  Showing {visibleMarkets.length} of {categoryMarkets.length} markets — Show More
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
