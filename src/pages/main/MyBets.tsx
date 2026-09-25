import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatUsd } from '../../data/mockData';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import TeamCrest from '../../components/TeamCrest';
import GuestGate from '../../components/GuestGate';

const tabs = ['Open', 'Won', 'Lost', 'All'] as const;
type Tab = (typeof tabs)[number];

export default function MyBets() {
  const { bets, isAuthenticated } = useApp();
  const [tab, setTab] = useState<Tab>('All');
  const navigate = useNavigate();

  const filtered = bets.filter((b) => {
    if (tab === 'All') return true;
    return b.status === tab.toLowerCase();
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <div className="px-4 pt-3.5">
          <h1 className="text-page-title-mobile sm:text-page-title mb-3">My Bets</h1>
        </div>
        <GuestGate
          icon={Ticket}
          heading="Log in to see your bets"
          message="Create an account or log in to track your open, won, and lost bets."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 pt-3.5">
        <h1 className="text-page-title-mobile sm:text-page-title mb-3">My Bets</h1>
        <div className="flex border-b border-border mb-3.5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-1 py-2 mr-5 text-secondary-text font-bold border-b-2 transition-colors duration-150 ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-text-secondary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-5">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Ticket}
            heading="No bets here"
            message="You don't have any bets in this category yet."
            ctaLabel="Browse Matches"
            onCta={() => navigate('/sports')}
          />
        ) : (
          <div className="space-y-2.5">
            {filtered.map((bet) => (
              <button
                key={bet.id}
                onClick={() => navigate(`/bet-details/${bet.id.replace('#', '')}`)}
                className="w-full text-left bg-card border border-border rounded-card p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-secondary-text font-bold">Bet {bet.id}</span>
                  <Badge variant={bet.status === 'open' ? 'open' : bet.status === 'won' ? 'won' : 'lost'}>
                    {bet.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-1 mb-2">
                  {bet.selections.slice(0, 2).map((s) => {
                    const [homeTeam, awayTeam] = s.matchLabel.split(' vs ');
                    return (
                      <div key={s.id} className="flex items-center gap-1 min-w-0">
                        <TeamCrest name={homeTeam} size={13} />
                        <span className="text-small-text font-medium truncate">{homeTeam}</span>
                        <span className="text-micro-text text-text-secondary flex-shrink-0">vs</span>
                        <TeamCrest name={awayTeam || ''} size={13} />
                        <span className="text-small-text font-medium truncate">{awayTeam}</span>
                        <span className="text-micro-text text-text-secondary flex-shrink-0">· {s.selectionLabel}</span>
                      </div>
                    );
                  })}
                  {bet.selections.length > 2 && (
                    <p className="text-micro-text text-text-secondary">+{bet.selections.length - 2} more</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-secondary-text text-text-secondary">Stake: {formatUsd(bet.stake)}</span>
                  <span className="text-body font-bold text-primary">
                    Win: {formatUsd(bet.potentialWin)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
