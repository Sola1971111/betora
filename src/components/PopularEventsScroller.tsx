import { useNavigate } from 'react-router-dom';
import { sportIcons } from '../data/sportIcons';
import type { Competition } from '../types';

interface PopularEventsScrollerProps {
  competitions: Competition[];
}

export default function PopularEventsScroller({ competitions }: PopularEventsScrollerProps) {
  const navigate = useNavigate();

  if (competitions.length === 0) return null;

  return (
    <div>
      <h2 className="text-section-heading mb-2">Popular Events</h2>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {competitions.map((c) => {
          const Icon = sportIcons[c.sportId];
          return (
            <button
              key={c.id}
              onClick={() => navigate(`/competition/${c.id}`)}
              className="flex-shrink-0 w-32 bg-card border border-border rounded-card p-3 text-left transition-colors duration-150 hover:border-primary/40"
            >
              <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center mb-2">
                {Icon && <Icon size={14} className="text-primary" />}
              </div>
              <p className="text-secondary-text font-semibold truncate">{c.name}</p>
              {c.country && <p className="text-micro-text text-text-secondary truncate">{c.country}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
