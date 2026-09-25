import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useApp } from '../../context/AppContext';
import { cryptoAddresses, formatUsd, BTC_USD_RATE, ETH_USD_RATE, SOL_USD_RATE } from '../../data/mockData';
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

export default function DepositPayment() {
  const { method } = useParams<{ method: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { requestDeposit } = useApp();
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = cryptoMethodMeta(method);
  const Icon = meta.icon;
  const amount = (location.state as { amount?: number } | null)?.amount ?? 0;
  const addressInfo = cryptoAddresses[meta.id];
  const rate = cryptoRates[meta.id];
  const equivalent = rate ? amount / rate : null;
  const symbol = cryptoSymbols[meta.id];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(addressInfo.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op for MVP
    }
  };

  const handleSent = async () => {
    setSubmitting(true);
    setError(null);
    const result = await requestDeposit(amount, meta.id);
    setSubmitting(false);
    if (result.success) {
      navigate('/deposit/pending', { state: { amount, method: meta.id } });
    } else {
      setError(result.error ?? 'Unable to process deposit');
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header title={`Send ${meta.shortLabel}`} showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-5">
        <div className="bg-card border border-border rounded-card p-4 mb-4 text-center">
          <p className="text-secondary-text text-text-secondary mb-1">Amount</p>
          <p className="text-page-title-mobile sm:text-page-title mb-1">{formatUsd(amount)}</p>
          {equivalent !== null && (
            <p className="text-secondary-text text-text-secondary">
              ≈ {equivalent.toFixed(meta.id === 'bitcoin' ? 8 : 6)} {symbol}
            </p>
          )}
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <Icon size={14} color={meta.iconColor} />
            <span className="text-small-text text-text-secondary font-medium">{addressInfo.network}</span>
          </div>
        </div>

        <div className="bg-white border border-border rounded-card p-6 flex flex-col items-center mb-4">
          <div className="p-3 bg-white rounded-card border border-border mb-4">
            <QRCodeSVG value={addressInfo.address} size={180} />
          </div>
          <p className="text-secondary-text text-text-secondary mb-1.5 text-center">Deposit Address</p>
          <p className="text-body font-mono text-center break-all mb-3 px-2">{addressInfo.address}</p>
          <Button variant="secondary" onClick={handleCopy} className="w-full">
            {copied ? (
              <span className="flex items-center justify-center gap-1.5">
                <Check size={16} /> Copied
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Copy size={16} /> Copy Address
              </span>
            )}
          </Button>
        </div>

        <div className="flex gap-2.5 bg-amber-light border border-amber/30 rounded-card p-3.5 mb-6">
          <AlertTriangle size={18} className="text-amber flex-shrink-0 mt-0.5" />
          <p className="text-secondary-text text-navy">
            Only send {meta.shortLabel} to this address using the {addressInfo.network}. Sending another asset or
            using a different network may result in permanent loss of funds.
          </p>
        </div>

        {error && <p className="text-small-text text-error mb-3">{error}</p>}

        <Button variant="primary" fullWidth onClick={handleSent} disabled={submitting}>
          {submitting ? 'Processing…' : "I've Sent the Payment"}
        </Button>
      </div>
    </div>
  );
}
