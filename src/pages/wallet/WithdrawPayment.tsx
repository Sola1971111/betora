import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useApp } from '../../context/AppContext';
import { formatUsd, BTC_USD_RATE, ETH_USD_RATE, SOL_USD_RATE, cryptoAddresses } from '../../data/mockData';
import { cryptoMethodMeta } from '../../data/cryptoMethods';

const cryptoRates: Record<string, number | undefined> = {
  bitcoin: BTC_USD_RATE,
  ethereum: ETH_USD_RATE,
  solana: SOL_USD_RATE,
};

const cryptoSymbols: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
};

export default function WithdrawPayment() {
  const { method } = useParams<{ method: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { withdraw } = useApp();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = cryptoMethodMeta(method);
  const Icon = meta.icon;
  const state = location.state as { amount?: number; address?: string } | null;
  const amount = state?.amount ?? 0;
  const address = state?.address ?? '';
  const network = cryptoAddresses[meta.id].network;
  const rate = cryptoRates[meta.id];
  const equivalent = rate ? amount / rate : null;
  const symbol = cryptoSymbols[meta.id];

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    const result = await withdraw(amount, meta.id, address);
    setSubmitting(false);
    if (result.success) {
      navigate('/withdrawal-success', { state: { amount, method: meta.id } });
    } else {
      setError(result.error ?? 'Unable to process withdrawal');
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header title="Confirm Withdrawal" showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-4">
        <div className="bg-card border border-border rounded-card p-4 mb-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Icon size={16} color={meta.iconColor} />
            <span className="text-secondary-text font-semibold">{meta.shortLabel} Withdrawal</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-body text-text-secondary">Amount</span>
            <span className="text-body font-semibold">{formatUsd(amount)}</span>
          </div>
          {equivalent !== null && (
            <div className="flex justify-between py-1.5 border-t border-border">
              <span className="text-body text-text-secondary">{symbol} Equivalent</span>
              <span className="text-body font-semibold">
                ≈ {equivalent.toFixed(meta.id === 'bitcoin' ? 8 : 6)} {symbol}
              </span>
            </div>
          )}
          <div className="flex justify-between py-1.5 border-t border-border">
            <span className="text-body text-text-secondary">Network</span>
            <span className="text-body font-semibold">{network}</span>
          </div>
          <div className="flex justify-between py-1.5 border-t border-border gap-3">
            <span className="text-body text-text-secondary flex-shrink-0">Destination</span>
            <span className="text-small-text font-mono text-right break-all">{address}</span>
          </div>
          <div className="flex justify-between py-1.5 border-t border-border">
            <span className="text-body text-text-secondary">Processing Time</span>
            <span className="text-secondary-text text-text-secondary text-right">Processing times may vary.</span>
          </div>
        </div>

        <div className="flex gap-2.5 bg-amber-light border border-amber/30 rounded-card p-3.5 mb-6">
          <AlertTriangle size={18} className="text-amber flex-shrink-0 mt-0.5" />
          <p className="text-secondary-text text-navy">
            Double-check the destination address and network. Crypto withdrawals cannot be reversed once sent.
          </p>
        </div>

        {error && <p className="text-small-text text-error mb-3">{error}</p>}

        <Button variant="primary" fullWidth onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Processing…' : 'Confirm Withdrawal'}
        </Button>
      </div>
    </div>
  );
}
