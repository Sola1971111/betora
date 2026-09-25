import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { sportIcons } from '../../data/sportIcons';
import { useSports } from '../../hooks/useSports';
import { useEvents } from '../../hooks/useEvents';
import MatchCard from '../../components/MatchCard';
import MatchListStatus from '../../components/MatchListStatus';

export default function Sports() {
  const navigate = useNavigate();
  const { data, loading: sportsLoading } = useSports();
  const sports = data?.sports ?? [];
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  // Default to the first available sport once the list loads
  const activeSport = selectedSport ?? sports[0]?.id ?? null;

  const competitions = useMemo(
    () => (data?.competitions ?? []).filter((c) => c.sportId === activeSport),
    [data, activeSport]
  );

  const { matches, loading, error, retry } = useEvents(activeSport);
  const upcomingMatches = matches.filter((m) => m.status === 'upcoming');

  return (
    <div>
      <div className="px-4 py-3.5">
        <h1 className="text-page-title-mobile sm:text-page-title mb-3">Sports</h1>

        {sportsLoading && sports.length === 0 ? (
          <p className="text-secondary-text text-text-secondary mb-3">Loading sports…</p>
        ) : (
          <div className="bg-card border border-border rounded-card divide-y divide-border overflow-hidden mb-5">
            {sports.map((sport) => {
              const Icon = sportIcons[sport.id];
              const isActive = sport.id === activeSport;
              return (
                <button
                  key={sport.id}
                  onClick={() => setSelectedSport(sport.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 text-left ${isActive ? 'bg-primary-light' : ''}`}
                >
                  {Icon && <Icon size={19} className={isActive ? 'text-primary' : 'text-text-secondary'} />}
                  <span className={`text-body font-medium flex-1 ${isActive ? 'text-primary' : ''}`}>{sport.name}</span>
                  {isActive && <ChevronRight size={16} className="text-primary" />}
                </button>
              );
            })}
          </div>
        )}

        {competitions.length > 0 && (
          <div className="mb-5">
            <h2 className="text-section-heading mb-2">Competitions</h2>
            <div className="space-y-2">
              {competitions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/competition/${c.id}`)}
                  className="w-full flex items-center justify-between bg-card border border-border rounded-card px-3.5 py-3 text-left"
                >
                  <div>
                    <p className="text-body font-medium">{c.name}</p>
                    {c.country && <p className="text-small-text text-text-secondary">{c.country}</p>}
                  </div>
                  <ChevronRight size={18} className="text-text-secondary" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {activeSport && (
        <div className="px-4 pb-5">
          <h2 className="text-section-heading mb-2">Events</h2>
          {loading || error || upcomingMatches.length === 0 ? (
            <MatchListStatus
              loading={loading}
              error={error}
              isEmpty={!loading && !error && upcomingMatches.length === 0}
              onRetry={retry}
              emptyMessage="No matches available for this sport right now"
            />
          ) : (
            <div className="space-y-2.5">
              {upcomingMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
