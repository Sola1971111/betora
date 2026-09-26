import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import Header from '../../components/Header';
import Badge from '../../components/Badge';
import TeamCrest from '../../components/TeamCrest';
import { fetchVirtualBetById } from '../../services/virtualApi';
import { formatUsd } from '../../data/mockData';
import type { VirtualBet } from '../../types/virtual';

export default function VirtualTicketDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bet, setBet] = useState<VirtualBet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    fetchVirtualBetById(id)
      .then((fetched) => {
        if (!cancelled) setBet(fetched);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load ticket');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Header title="Ticket Details" showBack showBalance={false} />
        <p className="p-6 text-body text-text-secondary text-center">Loading…</p>
      </div>
    );
  }

  if (error || !bet) {
    return (
      <div className="min-h-screen bg-bg">
        <Header title="Ticket Details" showBack showBalance={false} />
        <p className="p-6 text-body text-text-secondary text-center">{error ?? 'Ticket not found'}</p>
      </div>
    );
  }

  const isSettled = bet.status === 'won' || bet.status === 'lost';

  return (
    <div className="min-h-screen bg-bg">
      <Header title="Ticket Details" showBack showBalance={false} />

      <div className="px-4 py-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-small-text text-text-secondary">
              Virtual Football Ticket ID: {bet.id.replace('vb-', '').slice(0, 10)}
            </p>
            <p className="text-small-text text-text-secondary">
              {new Date(bet.placedAt).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })},{' '}
              {new Date(bet.placedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
            </p>
          </div>
          <Badge variant={bet.status === 'won' ? 'won' : bet.status === 'lost' ? 'lost' : 'open'}>
            {bet.status === 'pending' ? 'UNSETTLED' : bet.status.toUpperCase()}
          </Badge>
        </div>

        <div className="bg-card border border-border rounded-card p-4 mb-4">
          <p className="text-card-heading mb-3">{bet.type === 'multiple' ? 'Multiple' : 'Single'}</p>

          {isSettled && (
            <div className="flex items-center justify-between py-1.5">
              <span className="text-body text-text-secondary">Total Return</span>
              <span className={`text-body font-bold ${bet.status === 'won' ? 'text-primary' : ''}`}>
                {formatUsd(bet.status === 'won' ? bet.potentialWin : 0)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between py-1.5 border-t border-border">
            <span className="text-body text-text-secondary">Total Stake</span>
            <span className="text-body font-semibold">{formatUsd(bet.stake)}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-t border-border">
            <span className="text-body text-text-secondary">Total Odds</span>
            <span className="text-body font-semibold">{bet.combinedOdds.toFixed(2)}</span>
          </div>
          {!isSettled && (
            <div className="flex items-center justify-between py-1.5 border-t border-border">
              <span className="text-body text-text-secondary">Potential Win</span>
              <span className="text-body font-semibold text-primary">{formatUsd(bet.potentialWin)}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {bet.selections.map((sel) => (
            <div key={`${sel.fixtureId}-${sel.marketKey}`} className="flex gap-3">
              <div className="flex-shrink-0 pt-1">
                {sel.won === true && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                )}
                {sel.won === false && (
                  <div className="w-6 h-6 rounded-full bg-error flex items-center justify-center">
                    <X size={14} className="text-white" strokeWidth={3} />
                  </div>
                )}
                {sel.won === undefined && <div className="w-6 h-6 rounded-full border-2 border-border" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TeamCrest name={sel.homeTeam} size={15} />
                  <span className="text-card-heading truncate">{sel.homeTeam}</span>
                  <span className="text-small-text text-text-secondary flex-shrink-0">vs</span>
                  <span className="text-card-heading truncate">{sel.awayTeam}</span>
                  <TeamCrest name={sel.awayTeam} size={15} />
                </div>
                <p className="text-micro-text text-text-secondary mb-2">Virtual EPL</p>

                <div
                  className={`rounded-card p-3 ${
                    sel.won === true ? 'bg-primary-light' : sel.won === false ? 'bg-error/10' : 'bg-card border border-border'
                  }`}
                >
                  {sel.finalScore && (
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-small-text text-text-secondary">Final Score</span>
                      <span className="text-secondary-text font-bold">{sel.finalScore}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-small-text text-text-secondary">Pick</span>
                    <span className="text-secondary-text font-semibold">
                      {sel.outcomeLabel} @{sel.odds.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-small-text text-text-secondary">Market</span>
                    <span className="text-secondary-text font-semibold">{sel.marketTitle}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-small-text text-text-secondary">Outcome</span>
                    <span className="text-secondary-text font-semibold">{sel.outcomeLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/profile/transactions')}
          className="w-full flex items-center justify-between py-4 mt-4 border-t border-border text-body font-medium"
        >
          Check Transaction History
          <span className="text-text-secondary">›</span>
        </button>
      </div>
    </div>
  );
}
