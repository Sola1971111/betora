import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X, Trophy } from 'lucide-react';
import Header from '../../components/Header';
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

      {/* Dark summary card */}
      <div className="bg-navy px-4 py-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-small-text text-white/50">
            Virtual Football Ticket ID: {bet.id.replace('vb-', '').slice(0, 10)}
          </p>
          <p className="text-small-text text-white/50 flex-shrink-0">
            {new Date(bet.placedAt).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })},{' '}
            {new Date(bet.placedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
          </p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-card-heading text-white">{bet.type === 'multiple' ? 'Multiple' : 'Single'}</span>
          {isSettled ? (
            <span className={`flex items-center gap-1.5 text-card-heading font-bold ${bet.status === 'won' ? 'text-primary' : 'text-white/60'}`}>
              {bet.status === 'won' && <Trophy size={16} />}
              {bet.status === 'won' ? 'Won' : 'Lost'}
            </span>
          ) : (
            <span className="text-card-heading font-bold text-amber">Unsettled</span>
          )}
        </div>

        {isSettled && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-body text-white/50">Total Return</span>
            <span className={`text-page-title-mobile font-extrabold ${bet.status === 'won' ? 'text-primary' : 'text-white/70'}`}>
              {formatUsd(bet.status === 'won' ? bet.potentialWin : 0)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between py-1.5 border-t border-white/10">
          <span className="text-body text-white/50">Total Stake</span>
          <span className="text-body font-semibold text-white">{formatUsd(bet.stake)}</span>
        </div>
        <div className="flex items-center justify-between py-1.5 border-t border-white/10">
          <span className="text-body text-white/50">Total Odds</span>
          <span className="text-body font-semibold text-white">{bet.combinedOdds.toFixed(2)}</span>
        </div>
        {!isSettled && (
          <div className="flex items-center justify-between py-1.5 border-t border-white/10">
            <span className="text-body text-white/50">Potential Win</span>
            <span className="text-body font-semibold text-primary">{formatUsd(bet.potentialWin)}</span>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
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

                {sel.htScore && sel.finalScore ? (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-micro-text bg-card border border-border rounded-full px-2 py-0.5 text-text-secondary">
                      HT {sel.htScore}
                    </span>
                    <span className="text-micro-text bg-card border border-border rounded-full px-2 py-0.5 text-text-secondary">
                      FT {sel.finalScore}
                    </span>
                  </div>
                ) : (
                  <p className="text-micro-text text-text-secondary mb-2">Virtual EPL</p>
                )}

                <div
                  className={`rounded-card p-3 border ${
                    sel.won === true
                      ? 'bg-primary-light border-primary/30'
                      : sel.won === false
                      ? 'bg-bg border-border'
                      : 'bg-card border-border'
                  }`}
                >
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
                    <span className="text-secondary-text font-semibold">
                      {sel.actualOutcomeLabel ?? (sel.won === undefined ? '—' : sel.outcomeLabel)}
                    </span>
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
