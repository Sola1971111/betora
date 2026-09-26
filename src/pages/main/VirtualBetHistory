import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Trophy } from 'lucide-react';
import Header from '../../components/Header';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import GuestGate from '../../components/GuestGate';
import { useApp } from '../../context/AppContext';
import { fetchVirtualBetHistory } from '../../services/virtualApi';
import { formatUsd } from '../../data/mockData';
import type { VirtualBet } from '../../types/virtual';

const TABS = ['Settled', 'Unsettled', 'All'] as const;
type Tab = (typeof TABS)[number];

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function groupByDate(bets: VirtualBet[]): { label: string; bets: VirtualBet[] }[] {
  const groups: { label: string; bets: VirtualBet[] }[] = [];
  for (const bet of bets) {
    const label = dateLabel(bet.placedAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.bets.push(bet);
    } else {
      groups.push({ label, bets: [bet] });
    }
  }
  return groups;
}

export default function VirtualBetHistory() {
  const { isAuthenticated, user } = useApp();
  const [tab, setTab] = useState<Tab>('All');
  const [bets, setBets] = useState<VirtualBet[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;

    const load = async () => {
      try {
        const fetched = await fetchVirtualBetHistory(user.id);
        if (!cancelled) setBets(fetched);
      } catch {
        // best-effort — keep showing whatever was last loaded
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated, user]);

  const filtered = useMemo(() => {
    if (tab === 'All') return bets;
    if (tab === 'Unsettled') return bets.filter((b) => b.status === 'pending');
    return bets.filter((b) => b.status === 'won' || b.status === 'lost');
  }, [bets, tab]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg">
        <Header title="Bet History" showBack showBalance={false} />
        <GuestGate icon={Ticket} heading="Log in to see your bet history" message="Create an account or log in to track your virtual football tickets." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header title="Bet History" showBack showBalance={false} />

      <div className="px-4 pt-3">
        <div className="flex border-b border-border mb-3.5">
          {TABS.map((t) => (
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

      <div className="px-4 pb-6">
        {loading && bets.length === 0 ? (
          <p className="text-secondary-text text-text-secondary text-center py-10">Loading…</p>
        ) : grouped.length === 0 ? (
          <EmptyState
            icon={Ticket}
            heading="No tickets here"
            message="You don't have any virtual football tickets in this category yet."
            ctaLabel="Play Virtual Football"
            onCta={() => navigate('/virtual')}
          />
        ) : (
          <div className="space-y-5">
            {grouped.map((group) => (
              <div key={group.label}>
                <p className="text-secondary-text font-bold text-text-secondary mb-2">{group.label}</p>
                <div className="space-y-2.5">
                  {group.bets.map((bet) => (
                    <button
                      key={bet.id}
                      onClick={() => navigate(`/virtual/history/${bet.id}`)}
                      className="w-full text-left bg-card border border-border rounded-card p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-secondary-text font-bold">
                          {bet.status === 'won' && <Trophy size={13} className="text-primary" />}
                          {bet.type === 'multiple' ? 'Multiple' : 'Single'}
                        </span>
                        <Badge variant={bet.status === 'won' ? 'won' : bet.status === 'lost' ? 'lost' : 'open'}>
                          {bet.status === 'pending' ? 'UNSETTLED' : bet.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-secondary-text text-text-secondary">Total Return</span>
                        <span className={`text-body font-bold ${bet.status === 'won' ? 'text-primary' : ''}`}>
                          {formatUsd(bet.status === 'won' ? bet.potentialWin : 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
                        <span className="text-secondary-text text-text-secondary">Total Stake</span>
                        <span className="text-secondary-text font-semibold">{formatUsd(bet.stake)}</span>
                      </div>

                      <div className="space-y-0.5">
                        {bet.selections.slice(0, 3).map((s) => (
                          <p key={`${s.fixtureId}-${s.marketKey}`} className="text-small-text text-text-secondary truncate">
                            {s.homeTeam} vs {s.awayTeam}
                          </p>
                        ))}
                        {bet.selections.length > 3 && (
                          <p className="text-small-text text-text-secondary">
                            … (and {bet.selections.length - 3} other match{bet.selections.length - 3 > 1 ? 'es' : ''})
                          </p>
                        )}
                      </div>
                    </button>
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
