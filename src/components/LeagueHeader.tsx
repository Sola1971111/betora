import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { sportIcons } from '../data/sportIcons';

interface LeagueHeaderProps {
  sportId: string;
  name: string;
  country?: string;
  competitionId?: string;
}

export default function LeagueHeader({ sportId, name, country, competitionId }: LeagueHeaderProps) {
  const navigate = useNavigate();
  const Icon = sportIcons[sportId];

  return (
    <div className="flex items-center justify-between mb-2 mt-1">
      <div className="flex items-center gap-1.5 min-w-0">
        {Icon && <Icon size={13} className="text-text-secondary flex-shrink-0" />}
        <span className="text-card-heading truncate">{name}</span>
        {country && <span className="text-small-text text-text-secondary truncate">{country}</span>}
      </div>
      {competitionId && (
        <button
          onClick={() => navigate(`/competition/${competitionId}`)}
          className="flex items-center gap-0.5 text-small-text font-semibold text-primary flex-shrink-0"
        >
          View All
          <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}
