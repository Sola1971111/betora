import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Header from '../../components/Header';
import { CRYPTO_METHODS } from '../../data/cryptoMethods';

export default function DepositMethod() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg">
      <Header title="Deposit Funds" showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-5">
        <p className="text-secondary-text text-text-secondary mb-5">Choose a cryptocurrency to deposit.</p>

        <div className="space-y-3">
          {CRYPTO_METHODS.map(({ id, label, depositSubtitle, icon: Icon, iconColor, iconBg }) => (
            <button
              key={id}
              onClick={() => navigate(`/deposit/${id}/amount`)}
              className="w-full flex items-center gap-4 bg-card border border-border rounded-card p-4 text-left transition-all duration-150 hover:border-primary/40 active:scale-[0.99]"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <Icon size={24} color={iconColor} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-card-heading">{label}</p>
                <p className="text-secondary-text text-text-secondary">{depositSubtitle}</p>
              </div>
              <ChevronRight size={18} className="text-text-secondary flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
