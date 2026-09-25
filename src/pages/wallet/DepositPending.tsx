import { useLocation, useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import Button from '../../components/Button';
import { formatUsd } from '../../data/mockData';
import { cryptoMethodMeta } from '../../data/cryptoMethods';
import type { CryptoMethod } from '../../types';

export default function DepositPending() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { amount?: number; method?: CryptoMethod } | null;
  const amount = state?.amount ?? 0;
  const meta = cryptoMethodMeta(state?.method);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-light flex items-center justify-center mb-4">
        <Clock size={30} className="text-amber" strokeWidth={1.75} />
      </div>
      <h1 className="text-section-heading mb-1">Deposit Submitted</h1>
      <p className="text-secondary-text text-text-secondary mb-1 max-w-[280px]">
        Your {formatUsd(amount)} {meta.shortLabel} deposit is awaiting admin approval.
      </p>
      <p className="text-small-text text-text-secondary mb-8 max-w-[280px]">
        You'll get a notification and your balance will update once it's approved.
      </p>
      <div className="w-full max-w-sm space-y-3">
        <Button variant="primary" fullWidth onClick={() => navigate('/profile/transactions')}>
          View Transaction History
        </Button>
        <Button variant="secondary" fullWidth onClick={() => navigate('/profile')}>
          Back to Profile
        </Button>
      </div>
    </div>
  );
}
