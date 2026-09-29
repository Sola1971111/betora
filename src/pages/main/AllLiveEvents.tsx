import { useMemo } from 'react';
import { Radio } from 'lucide-react';
import Header from '../../components/Header';
import LiveEventRow from '../../components/LiveEventRow';
import EmptyState from '../../components/EmptyState';
import { useLiveEvents } from '../../hooks/useLiveEvents';

export default function AllLiveEvents() {
  // /live is the full-breadth page (all sports) — still bounded, not
  // "fetch everything," since even here we don't want to render or hold
  // an unbounded list.
  const { matches, loading, error } = useLiveEvents(undefined, undefined, 60);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof matches>();
    for (const m of matches) {
      const key = m.competitionName || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [matches]);

  return (
    <div className="min-h-screen bg-bg">
      <Header title="Live Events" showBack showBalance={false} />

      <div className="max-w-app mx-auto px-4 py-4">
        {loading && matches.length === 0 ? (
          <p className="text-secondary-text text-text-secondary text-center py-10">Loading live events…</p>
        ) : error && matches.length === 0 ? (
          <p className="text-secondary-text text-error text-center py-10">{error}</p>
        ) : matches.length === 0 ? (
          <EmptyState icon={Radio} heading="No live events right now" message="Check back once a match kicks off." />
        ) : (
          <div className="space-y-5">
            {grouped.map(([competition, group]) => (
              <div key={competition}>
                <h2 className="text-card-heading mb-1">{competition}</h2>
                <div>
                  {group.map((m) => (
                    <LiveEventRow key={m.id} match={m} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
