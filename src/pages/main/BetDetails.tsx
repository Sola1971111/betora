import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatUsd } from '../../data/mockData';
import Header from '../../components/Header';
import Badge from '../../components/Badge';
import TeamCrest from '../../components/TeamCrest';

export default function BetDetails() {
  const { id } = useParams();
  const { bets } = useApp();
  const bet = bets.find((b) => b.id === `#${id}`);

  if (!bet) {
    return (
      <div className="min-h-screen bg-bg">
        <Header title="Bet Details" showBack showBalance={false} showNotifications={false} />
        <p className="p-6 text-body text-text-secondary">Bet not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header title={bet.id} showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-4">
        <div className="bg-card border border-border rounded-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-card-heading">{bet.id}</span>
            <Badge variant={bet.status === 'open' ? 'open' : bet.status === 'won' ? 'won' : 'lost'}>
              {bet.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-secondary-text text-text-secondary mb-1">
            {new Date(bet.placedAt).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="text-secondary-text text-text-secondary capitalize">{bet.type} bet</p>
        </div>

        <h2 className="text-card-heading mb-2">Selections</h2>
        <div className="bg-card border border-border rounded-card divide-y divide-border mb-4">
          {bet.selections.map((s) => {
            const [homeTeam, awayTeam] = s.matchLabel.split(' vs ');
            return (
              <div key={s.id} className="p-3.5">
                <div className="flex items-center gap-1.5 mb-1 min-w-0">
                  <TeamCrest name={homeTeam} size={16} />
                  <span className="text-body font-semibold truncate">{homeTeam}</span>
                  <span className="text-micro-text text-text-secondary flex-shrink-0">vs</span>
                  <TeamCrest name={awayTeam || ''} size={16} />
                  <span className="text-body font-semibold truncate">{awayTeam}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary-text text-text-secondary">
                    {s.marketName} · <span className="font-semibold text-text">{s.selectionLabel}</span>
                  </span>
                  <span className="text-body font-semibold">{s.odds.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-card p-4 space-y-2.5">
          <div className="flex justify-between">
            <span className="text-body text-text-secondary">Combined Odds</span>
            <span className="text-body font-semibold">{bet.combinedOdds.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-body text-text-secondary">Stake</span>
            <span className="text-body font-semibold">{formatUsd(bet.stake)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="text-body text-text-secondary">Potential Win</span>
            <span className="text-balance text-primary">{formatUsd(bet.potentialWin)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
