import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MatchCard from '../../components/MatchCard';
import Header from '../../components/Header';
import MatchListStatus from '../../components/MatchListStatus';
import { useSports } from '../../hooks/useSports';
import { useEvents } from '../../hooks/useEvents';

export default function Competition() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useSports();
  const competition = data?.competitions.find((c) => c.id === id);

  const { matches, loading, error, retry } = useEvents(competition?.sportId ?? null);
  const compMatches = useMemo(
    () => matches.filter((m) => m.competitionId === id && m.status === 'upcoming'),
    [matches, id]
  );

  return (
    <div className="min-h-screen bg-bg">
      <Header title={competition?.name ?? 'Competition'} showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-3.5">
        {loading || error || compMatches.length === 0 ? (
          <MatchListStatus
            loading={loading}
            error={error}
            isEmpty={!loading && !error && compMatches.length === 0}
            onRetry={retry}
            emptyMessage="There are no upcoming matches in this competition right now."
          />
        ) : (
          <div className="space-y-2.5">
            {compMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
        {!loading && !error && compMatches.length === 0 && (
          <button
            onClick={() => navigate('/sports')}
            className="w-full mt-2 px-4 h-11 rounded bg-navy text-white text-button-text font-semibold"
          >
            Browse Sports
          </button>
        )}
      </div>
    </div>
  );
}
