import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Radio, Gamepad2, Gift } from 'lucide-react';
import { sportIcons } from '../../data/sportIcons';
import MatchCard from '../../components/MatchCard';
import LiveMatchCard from '../../components/LiveMatchCard';
import FeaturedMatchCard from '../../components/FeaturedMatchCard';
import PromoCodeCard from '../../components/PromoCodeCard';
import Footer from '../../components/Footer';
import PopularEventsScroller from '../../components/PopularEventsScroller';
import LeagueHeader from '../../components/LeagueHeader';
import CryptoBonusBanner from '../../components/CryptoBonusBanner';
import MatchListStatus from '../../components/MatchListStatus';
import { useSports } from '../../hooks/useSports';
import { useEvents } from '../../hooks/useEvents';
import { useLiveEvents } from '../../hooks/useLiveEvents';

export default function Home() {
  const navigate = useNavigate();
  const { data: sportsData } = useSports();
  const sports = sportsData?.sports ?? [];
  const competitions = sportsData?.competitions ?? [];
  const refreshInterval = sportsData?.liveOddsRefreshIntervalMs;

  // Football drives the main "Today's Football" + "Upcoming" sections on Home,
  // matching the previous layout; other sports are reachable via Sports page.
  const { matches, loading, error, retry } = useEvents('football');
  // Real live coverage can run into the hundreds of matches globally — Home
  // only needs enough to fill a short horizontal scroller, not all of them
  // (that's what the dedicated Live page, and its full unfiltered list, is for).
  const { matches: liveMatches } = useLiveEvents(undefined, refreshInterval, 20);

  // With real full league coverage this can now run into the hundreds —
  // "Popular Events" is a short curated-feeling row, not an index of every
  // league that exists (that's what the Sports page, with its own cap and
  // Show More, is for).
  const footballCompetitions = useMemo(
    () => competitions.filter((c) => c.sportId === 'football').slice(0, 12),
    [competitions]
  );
  const upcomingMatches = useMemo(() => matches.filter((m) => m.status === 'upcoming'), [matches]);
  const featuredMatch = upcomingMatches[0];
  const todaysFootball = useMemo(() => upcomingMatches.slice(0, 4), [upcomingMatches]);
  const restUpcoming = useMemo(() => upcomingMatches.slice(4, 8), [upcomingMatches]);

  const showFootballStatus = loading || !!error || (!loading && upcomingMatches.length === 0);

  return (
    <div className="px-4 py-3.5 space-y-5">
      {/* Quick nav — shortcuts to Sports, Live, Virtual, Promotions.
          Deliberately NOT a 6th bottom-tab icon; this row lives on Home only. */}
      <div className="grid grid-cols-4 gap-2 -mt-1">
        {[
          { to: '/sports', label: 'All Sports', icon: LayoutGrid },
          { to: '/live', label: 'Live', icon: Radio, badge: liveMatches.length },
          { to: '/virtual', label: 'Virtual', icon: Gamepad2 },
          { to: '/promotions', label: 'Promos', icon: Gift },
        ].map(({ to, label, icon: Icon, badge }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="relative flex flex-col items-center gap-1 py-2 rounded-card bg-card border border-border"
          >
            <Icon size={19} className="text-navy" />
            <span className="text-micro-text font-semibold text-text-secondary">{label}</span>
            {!!badge && (
              <span className="absolute top-1.5 right-1/2 translate-x-3.5 w-2 h-2 rounded-full bg-error" />
            )}
          </button>
        ))}
      </div>

      {/* Crypto deposit bonus banner */}
      <CryptoBonusBanner />

      {/* Quick sports */}
      {sports.length > 0 && (
        <div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {sports.map((sport) => {
              const Icon = sportIcons[sport.id];
              const isFootball = sport.id === 'football';
              return (
                <button
                  key={sport.id}
                  onClick={() => navigate('/sports')}
                  className={`flex items-center gap-1.5 flex-shrink-0 px-3 h-9 rounded-full transition-colors duration-150 ${
                    isFootball ? 'bg-primary text-white' : 'bg-slate-100 text-text'
                  }`}
                >
                  {Icon && <Icon size={14} className={isFootball ? 'text-white' : 'text-text-secondary'} />}
                  <span className="text-secondary-text font-semibold whitespace-nowrap">{sport.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Live now — only genuinely live events, never upcoming ones mislabeled.
          Capped at the fetch level (see hook call above); this is a short
          horizontal preview, not the full list — that lives on /live. */}
      {liveMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-section-heading">Live Now</h2>
            <span className="flex items-center gap-1 bg-error/10 px-1.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-error animate-[pulseSoft_1.6s_ease-in-out_infinite]" />
              <span className="text-micro-text font-bold text-error">LIVE</span>
            </span>
            <button onClick={() => navigate('/live')} className="ml-auto text-micro-text font-semibold text-primary">
              See All
            </button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {liveMatches.slice(0, 20).map((m) => (
              <LiveMatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}

      {/* Popular events (football only, since this section sits inside a football-focused Home) */}
      <PopularEventsScroller competitions={footballCompetitions} />

      {/* Featured match */}
      {featuredMatch && <FeaturedMatchCard match={featuredMatch} />}

      {/* Today's football */}
      <div>
        <LeagueHeader sportId="football" name="Today's Football" competitionId={footballCompetitions[0]?.id} />
        {showFootballStatus ? (
          <MatchListStatus
            loading={loading}
            error={error}
            isEmpty={!loading && !error && upcomingMatches.length === 0}
            onRetry={retry}
            emptyMessage="No football matches available right now"
          />
        ) : (
          <div className="space-y-2.5">
            {todaysFootball.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      {restUpcoming.length > 0 && (
        <div>
          <h2 className="text-section-heading mb-2">Upcoming Matches</h2>
          <div className="space-y-2.5">
            {restUpcoming.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}

      {/* Promo Code */}
      <PromoCodeCard />

      <Footer />
    </div>
  );
}
