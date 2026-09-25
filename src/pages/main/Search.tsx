import { useState, useMemo } from 'react';
import { Search as SearchIcon, SearchX, X } from 'lucide-react';
import Header from '../../components/Header';
import MatchCard from '../../components/MatchCard';
import EmptyState from '../../components/EmptyState';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../../hooks/useEvents';

const recentSearchesSeed = ['Arsenal', 'Premier League', 'Chelsea'];

export default function Search() {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState(recentSearchesSeed);
  const navigate = useNavigate();

  // Search spans all three Betora sports.
  const football = useEvents('football');
  const basketball = useEvents('basketball');
  const tennis = useEvents('tennis');
  const allMatches = useMemo(
    () => [...football.matches, ...basketball.matches, ...tennis.matches],
    [football.matches, basketball.matches, tennis.matches]
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allMatches.filter(
      (m) =>
        m.homeTeam.toLowerCase().includes(q) ||
        m.awayTeam.toLowerCase().includes(q) ||
        m.competitionName.toLowerCase().includes(q)
    );
  }, [query, allMatches]);

  const handleRecentClick = (term: string) => setQuery(term);

  const handleSubmit = () => {
    if (query.trim() && !recent.includes(query.trim())) {
      setRecent([query.trim(), ...recent].slice(0, 5));
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header title="Search" showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-3.5">
        <div className="relative mb-4">
          <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Search teams, competitions, matches"
            className="w-full h-12 pl-10 pr-10 rounded border border-border bg-white text-body focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-bg"
            >
              <X size={16} className="text-text-secondary" />
            </button>
          )}
        </div>

        {!query && (
          <div>
            <h2 className="text-card-heading mb-2">Recent Searches</h2>
            <div className="flex flex-wrap gap-2">
              {recent.map((term) => (
                <button
                  key={term}
                  onClick={() => handleRecentClick(term)}
                  className="px-3.5 h-9 rounded-full border border-border bg-card text-secondary-text font-medium"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {query && results.length === 0 && (
          <EmptyState
            icon={SearchX}
            heading="No results found"
            message={`We couldn't find anything matching "${query}".`}
            ctaLabel="Browse Matches"
            onCta={() => navigate('/sports')}
          />
        )}

        {query && results.length > 0 && (
          <div className="space-y-2.5">
            {results.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
