import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { cryptoMethodMeta } from '../../data/cryptoMethods';

const quickAmounts = [25, 50, 100, 250, 500];

export default function DepositAmount() {
  const { method } = useParams<{ method: string }>();
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number | ''>(100);

  const meta = cryptoMethodMeta(method);
  const Icon = meta.icon;

  const handleContinue = () => {
    if (typeof amount === 'number' && amount > 0) {
      navigate(`/deposit/${meta.id}/payment`, { state: { amount } });
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header title={`Deposit ${meta.shortLabel}`} showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-5">
        <div className="flex items-center gap-2 mb-5">
          <Icon size={18} color={meta.iconColor} />
          <span className="text-secondary-text text-text-secondary">Enter the USD amount you'd like to deposit</span>
        </div>

        <label className="block text-secondary-text font-medium text-text-secondary mb-1.5">Amount (USD)</label>
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full h-14 px-4 rounded border border-border bg-white text-page-title-mobile font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150 mb-4"
          placeholder="$0"
        />

        <div className="grid grid-cols-5 gap-2 mb-8">
          {quickAmounts.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(q)}
              className={`h-11 rounded border font-semibold text-secondary-text transition-colors duration-150 ${
                amount === q ? 'bg-primary-light border-primary text-primary' : 'border-border text-text-secondary'
              }`}
            >
              {`$${q}`}
            </button>
          ))}
        </div>

        <Button variant="primary" fullWidth onClick={handleContinue} disabled={!amount}>
          Continue
        </Button>
      </div>
    </div>
  );
}
