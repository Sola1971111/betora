import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import Button from '../../components/Button';
import { formatUsd } from '../../data/mockData';
import type { PlacedBet } from '../../types';

export default function BetConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const bet = (location.state as { bet?: PlacedBet } | null)?.bet;

  if (!bet) {
    navigate('/home', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mb-4 animate-[bumpIn_400ms_ease-out]">
        <CheckCircle2 size={32} className="text-primary" strokeWidth={1.75} />
      </div>
      <h1 className="text-section-heading mb-1">Bet Placed Successfully</h1>
      <p className="text-secondary-text text-text-secondary mb-6">Bet ID: {bet.id}</p>

      <div className="w-full max-w-sm bg-card border border-border rounded-card p-4 mb-6 space-y-2.5">
        <div className="flex justify-between">
          <span className="text-body text-text-secondary">Stake</span>
          <span className="text-body font-semibold">{formatUsd(bet.stake)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-border">
          <span className="text-body text-text-secondary">Potential Win</span>
          <span className="text-balance text-primary">{formatUsd(bet.potentialWin)}</span>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <Button variant="primary" fullWidth onClick={() => navigate('/my-bets')}>
          View My Bets
        </Button>
        <Button variant="secondary" fullWidth onClick={() => navigate('/home')}>
          Continue Betting
        </Button>
      </div>
    </div>
  );
}
