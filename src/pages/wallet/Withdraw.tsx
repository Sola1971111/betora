import { useNavigate } from 'react-router-dom';
import { ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import Header from '../../components/Header';
import { useApp } from '../../context/AppContext';
import { formatUsd } from '../../data/mockData';
import { CRYPTO_METHODS } from '../../data/cryptoMethods';

export default function Withdraw() {
  const navigate = useNavigate();
  const { balance } = useApp();
  const [reveal, setReveal] = useState(true);

  return (
    <div className="min-h-screen bg-bg">
      <Header title="Withdraw Funds" showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-4">
        <div className="bg-card border border-border rounded-card p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-secondary-text text-text-secondary mb-1">Available Balance</p>
            <p className="text-balance text-navy">{reveal ? formatUsd(balance) : '$••••••'}</p>
          </div>
          <button
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? 'Hide balance' : 'Show balance'}
            className="p-2 rounded-full hover:bg-bg transition-colors duration-150"
          >
            {reveal ? <Eye size={18} className="text-text-secondary" /> : <EyeOff size={18} className="text-text-secondary" />}
          </button>
        </div>

        <p className="text-secondary-text text-text-secondary mb-3">Choose a cryptocurrency to withdraw to.</p>

        <div className="space-y-3">
          {CRYPTO_METHODS.map(({ id, label, withdrawSubtitle, icon: Icon, iconColor, iconBg }) => (
            <button
              key={id}
              onClick={() => navigate(`/withdraw/${id}/amount`)}
              className="w-full flex items-center gap-4 bg-card border border-border rounded-card p-4 text-left transition-all duration-150 hover:border-primary/40 active:scale-[0.99]"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <Icon size={24} color={iconColor} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-card-heading">{label}</p>
                <p className="text-secondary-text text-text-secondary">{withdrawSubtitle}</p>
              </div>
              <ChevronRight size={18} className="text-text-secondary flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
